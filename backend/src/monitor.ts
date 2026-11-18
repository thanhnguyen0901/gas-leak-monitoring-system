import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { Alert, Device, Reading, parseReading } from './contracts';
import { MonitorGateway } from './gateway';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  protected devices = new Map<string, Device>();
  protected readings: Reading[] = [];
  protected alerts: Alert[] = [];
  protected seenAlerts = new Set<string>();
  private latestSequences = new Map<string, number>();
  private client?: MqttClient;
  private timer?: NodeJS.Timeout;
  private pending = Promise.resolve();
  private queued = 0;
  private logger = new Logger('Monitor');
  mqttConnected = false;
  invalidMessages = 0;
  droppedMessages = 0;
  constructor(private readonly gateway: MonitorGateway) {}
  async onModuleInit() {
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
      if (packet.retain && !topic.endsWith('/status')) return;
      if (this.queued >= 1000) { this.droppedMessages++; return; }
      this.queued++;
      this.pending = this.pending.then(() => this.ingest(topic, payload)).catch(() => {
        this.invalidMessages++; this.logger.warn('Message processing failed');
      }).finally(() => { this.queued--; });
    });
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.client?.endAsync(true);
    await this.pending;
  }
  async ingest(topic: string, payload: Buffer) {
    const status = /^gas-monitor\/device\/([A-Za-z0-9_-]{1,64})\/status$/.exec(topic);
    if (status) {
      if (payload.length > 128) throw new Error('Status too large');
      const value = JSON.parse(payload.toString());
      if (typeof value.online !== 'boolean') throw new Error('Invalid status');
      const existing = this.devices.get(status[1]);
      if (existing) existing.online = value.online;
      this.gateway.emit('devices', this.getDevices()); return;
    }
    const { kind, value } = parseReading(topic, payload);
    const sample: Reading = { ...value, receivedAt: new Date().toISOString() };
    const key = `${sample.deviceId}:${sample.bootId}:${sample.sequence}`;
    if (kind === 'alert') {
      if (sample.previousState === sample.state || this.seenAlerts.has(key)) return;
      const alert: Alert = { ...sample, id: key, recovery: sample.state === 'SAFE' };
      await this.saveAlert(alert);
      this.seenAlerts.add(key);
      if (this.seenAlerts.size > 10000) this.seenAlerts.delete(this.seenAlerts.values().next().value!);
      this.alerts.unshift(alert); this.alerts.length = Math.min(this.alerts.length, 1000);
      this.gateway.emit('alert', alert);
      return;
    }
    const sequenceKey = `${sample.deviceId}:${sample.bootId}`;
    if (sample.sequence <= (this.latestSequences.get(sequenceKey) ?? -1)) return;
    if (!this.devices.has(sample.deviceId) && this.devices.size >= 1000) throw new Error('Device capacity reached');
    await this.saveReading(sample);
    this.latestSequences.set(sequenceKey, sample.sequence);
    if (this.latestSequences.size > 2000) this.latestSequences.delete(this.latestSequences.keys().next().value!);
    this.readings.unshift(sample); this.readings.length = Math.min(this.readings.length, 2000);
    this.devices.set(sample.deviceId, { id: sample.deviceId, latest: sample, lastSeen: sample.receivedAt, online: true });
    this.gateway.emit('reading', sample);
    this.gateway.emit('devices', this.getDevices());
  }
  protected async saveReading(_reading: Reading): Promise<void> {}
  protected async saveAlert(_alert: Alert): Promise<void> {}
  getDevices() {
    const timeout = Number(process.env.STALE_AFTER_MS || 10000);
    return [...this.devices.values()].map(d => ({ ...d, online: d.online && Date.now()-Date.parse(d.lastSeen) < timeout }));
  }
  async getReadings(id: string, limit: number) { return this.readings.filter(r => r.deviceId === id).slice(0, limit); }
  async getAlerts(id: string | undefined, limit: number) { return this.alerts.filter(a => !id || a.deviceId === id).slice(0, limit); }
  health() { return { status: 'ok', storage: 'memory', mqttConnected: this.mqttConnected, invalidMessages: this.invalidMessages, droppedMessages: this.droppedMessages }; }
}
