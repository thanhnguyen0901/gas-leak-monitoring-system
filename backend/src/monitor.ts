import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { Alert, Device, Reading, parseReading, parseStatus, IngestionValidationError } from './contracts';
import { MonitorGateway } from './gateway';
import { StorageService } from './storage';
import { TelegramService } from './telegram';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  protected devices = new Map<string, Device>();
  protected readings: Reading[] = [];
  protected alerts: Alert[] = [];
  protected seenAlerts = new Set<string>();
  private latestSequences = new Map<string, number>();
  private retiredBoots = new Set<string>();
  private client?: MqttClient;
  private timer?: NodeJS.Timeout;
  private pending = Promise.resolve();
  private queued = 0;
  private stopping=false;
  private logger = new Logger('Monitor');
  mqttConnected = false;
  invalidMessages = 0;
  processingErrors=0;
  droppedMessages = 0;
  constructor(@Inject(MonitorGateway) private readonly gateway: MonitorGateway, @Inject(StorageService) private readonly storage: StorageService, @Inject(TelegramService) private readonly telegram: TelegramService) {}
  async onModuleInit() {
    await this.storage.ready();
    for (const d of await this.storage.loadDevices()) this.devices.set(d.id, { id:d.id, latest:d.latest, lastSeen:new Date(d.last_seen).toISOString(), online:false });
    this.timer = setInterval(() => this.gateway.emit('devices', this.getDevices()), 1000);
    const url = process.env.MQTT_URL;
    if (!url) return;
    if (!/^mqtts?:\/\//.test(url)) throw new Error('MQTT_URL must use mqtt:// or mqtts://');
    this.client = connect(url, {
      username: process.env.MQTT_USER || undefined, password: process.env.MQTT_PASSWORD || undefined,
      reconnectPeriod: 2000, connectTimeout: 5000, rejectUnauthorized: true,
      clientId: `gas-backend-${process.pid}`, resubscribe: false,
    });
    this.client.on('connect', async () => {
      try { await this.client!.subscribeAsync('gas-monitor/device/+/+', { qos: 1 }); this.mqttConnected = true; }
      catch { this.logger.warn('MQTT subscription failed'); }
    });
    this.client.on('offline', () => { this.mqttConnected = false; });
    this.client.on('close', () => { this.mqttConnected = false; });
    this.client.on('error', () => { this.logger.warn('MQTT connection error; retrying'); });
    this.client.on('message', (topic, payload, packet) => {
      // Ignore retained readings/events to avoid replayed notifications. Status is intentionally retained.
      if(this.stopping)return;
      if (topic.endsWith('/ack') || (packet.retain && !topic.endsWith('/status'))) return;
      if (this.queued >= 1000) { this.droppedMessages++; return; }
      this.queued++;
      this.pending = this.pending.then(() => this.stopping?undefined:this.ingest(topic, payload)).catch(error => {
        if(error instanceof IngestionValidationError)this.invalidMessages++;else this.processingErrors++;
        this.logger.warn('Message rejected or processing unavailable');
      }).finally(() => { this.queued--; });
    });
  }
  async onModuleDestroy() {
    this.stopping=true;
    if (this.timer) clearInterval(this.timer);
    await this.client?.endAsync(true);
    await this.pending;
  }
  async ingest(topic: string, payload: Buffer) {
    const status = /^gas-monitor\/device\/([A-Za-z0-9_-]{1,64})\/status$/.exec(topic);
    if (status) {
      const online=parseStatus(payload);
      const existing = this.devices.get(status[1]);
      if (existing) existing.online = online;
      this.gateway.emit('devices', this.getDevices()); return;
    }
    const { kind, value } = parseReading(topic, payload);
    const sample: Reading = { ...value, receivedAt: new Date().toISOString() };
    const key = `${sample.deviceId}:${sample.bootId}:${sample.sequence}`;
    if (kind === 'alert') {
      if (sample.previousState === sample.state && (sample.sensorStatus??'OK')===(sample.previousSensorStatus??'OK')) return;
      if (this.seenAlerts.has(key)) {this.acknowledge(sample);return;}
      const alert: Alert = { ...sample, id: key, recovery: sample.state === 'SAFE' };
      const inserted=await this.storage.saveAlert(alert,this.telegram.enabled);
      this.acknowledge(sample);
      if(!inserted)return;
      this.seenAlerts.add(key);
      if (this.seenAlerts.size > 10000) this.seenAlerts.delete(this.seenAlerts.values().next().value!);
      this.alerts.unshift(alert); this.alerts.length = Math.min(this.alerts.length, 1000);
      this.gateway.emit('alert', alert);
      this.telegram.enqueue(alert);
      return;
    }
    const sequenceKey = `${sample.deviceId}:${sample.bootId}`;
    const current=this.devices.get(sample.deviceId)?.latest;
    if(current?.bootId===sample.bootId && sample.sequence<=current.sequence)return;
    if(current && current.bootId!==sample.bootId && (this.retiredBoots.has(sequenceKey)||await this.storage.knownBoot(sample.deviceId,sample.bootId)))return;
    if (sample.sequence <= (this.latestSequences.get(sequenceKey) ?? -1)) return;
    if (!this.devices.has(sample.deviceId) && this.devices.size >= 1000) throw new Error('Device capacity reached');
    if (!await this.storage.saveReading(sample)) return;
    if(current && current.bootId!==sample.bootId) this.retiredBoots.add(`${sample.deviceId}:${current.bootId}`);
    if(this.retiredBoots.size>2000)this.retiredBoots.delete(this.retiredBoots.values().next().value!);
    this.latestSequences.set(sequenceKey, sample.sequence);
    if (this.latestSequences.size > 2000) this.latestSequences.delete(this.latestSequences.keys().next().value!);
    this.readings.unshift(sample); this.readings.length = Math.min(this.readings.length, 2000);
    this.devices.set(sample.deviceId, { id: sample.deviceId, latest: sample, lastSeen: sample.receivedAt, online: true });
    this.gateway.emit('reading', sample);
    this.gateway.emit('devices', this.getDevices());
  }
  private acknowledge(sample:Reading) {
    if(this.storage.pool&&this.client?.connected)this.client.publish(`gas-monitor/device/${sample.deviceId}/ack`,JSON.stringify({eventId:`${sample.bootId}:${sample.sequence}`}),{qos:1,retain:false},()=>{});
  }
  getDevices() {
    const timeout = Number(process.env.STALE_AFTER_MS || 10000);
    return [...this.devices.values()].map(d => ({ ...d, online: d.online && Date.now()-Date.parse(d.lastSeen) < timeout }));
  }
  async getReadings(id: string, limit: number) { return this.storage.pool ? this.storage.history(id,limit) : this.readings.filter(r => r.deviceId === id).slice(0, limit); }
  async getAlerts(id: string | undefined, limit: number) { return this.storage.pool ? this.storage.alertHistory(id,limit) : this.alerts.filter(a => !id || a.deviceId === id).slice(0, limit); }
  async health() {
    const storageAvailable=await this.storage.available();
    let notifications:unknown={enabled:this.telegram.enabled,durable:Boolean(this.storage.pool),unavailable:true};
    if(storageAvailable)notifications=await this.telegram.stats();
    return {status:storageAvailable?'ok':'degraded',storageAvailable,notifications,storage:this.storage.pool?'postgresql':'memory',
      mqttConnected:this.mqttConnected,ingestionQueued:this.queued,processingErrors:this.processingErrors,invalidMessages:this.invalidMessages,droppedMessages:this.droppedMessages};
  }
}
