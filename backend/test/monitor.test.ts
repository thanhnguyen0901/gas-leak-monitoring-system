import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import Aedes from 'aedes';
import { connect } from 'mqtt';
import { io } from 'socket.io-client';
import { createApp } from '../src/main';
import { parseReading } from '../src/contracts';
export const sample = { version: 1, deviceId: 'test-01', bootId: '0123456789abcdef', sequence: 1, uptimeMs: 500, rawAdc: 1500, state: 'WARNING', previousState: 'SAFE', fanOn: true, simulated: true };
const topic = 'gas-monitor/device/test-01/';
export async function waitFor(check: () => Promise<boolean> | boolean, timeout=5000) {
  const start=Date.now(); while (Date.now()-start<timeout) { if (await check()) return; await new Promise(r=>setTimeout(r,25)); }
  throw new Error('Condition timed out');
}
test('reject malformed, mismatched and out-of-range MQTT data', () => {
  for (const value of [{...sample,rawAdc:4096},{...sample,fanOn:false},{...sample,deviceId:'different'},{...sample,rawAdc:1.5},{...sample,state:'UNKNOWN'}])
    assert.throws(()=>parseReading(topic+'telemetry',Buffer.from(JSON.stringify(value))));
  assert.throws(()=>parseReading(topic+'telemetry',Buffer.from('{')));
});
test('MQTT to NestJS REST/WebSocket; alert deduplication and stale device status', async () => {
  const broker = new Aedes(); const tcp = createServer(broker.handle);
  await new Promise<void>(r=>tcp.listen(0,'127.0.0.1',r));
  const address=tcp.address() as {port:number};
  process.env.MQTT_URL=`mqtt://127.0.0.1:${address.port}`; process.env.STALE_AFTER_MS='200';
  const app=await createApp(); await app.listen(0,'127.0.0.1');
  const base=await app.getUrl(); const publisher=connect(process.env.MQTT_URL); const socket=io(base,{transports:['websocket']});
  try {
    await waitFor(async()=> (await (await fetch(base+'/api/health')).json()).mqttConnected);
    await waitFor(()=>socket.connected);
    const seen = new Promise<any>(resolve=>socket.once('reading',resolve));
    await publisher.publishAsync(topic+'telemetry',JSON.stringify(sample),{qos:1});
    assert.equal((await Promise.race([seen, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("WebSocket reading timeout")), 5000))])).rawAdc,1500);
    const readings=await (await fetch(base+'/api/devices/test-01/readings')).json(); assert.equal(readings.length,1);
    await publisher.publishAsync(topic+'alert',JSON.stringify(sample),{qos:1});
    await publisher.publishAsync(topic+'alert',JSON.stringify(sample),{qos:1});
    await waitFor(async()=> (await (await fetch(base+'/api/alerts')).json()).length===1);
    assert.equal((await (await fetch(base+'/api/alerts')).json())[0].recovery,false);
    assert.equal((await fetch(base+'/api/devices/test-01/readings?limit=-1')).status,400);
    await waitFor(async()=> !(await (await fetch(base+'/api/devices')).json())[0].online);
  } finally {
    socket.close(); await publisher.endAsync(true); await app.close();
    await new Promise<void>(r=>tcp.close(()=>r())); await new Promise<void>(r=>broker.close(()=>r()));
  }
});
