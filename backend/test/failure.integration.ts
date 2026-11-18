import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer,Server} from 'node:net';
import Aedes from 'aedes';
import {connect} from 'mqtt';
import {createApp} from '../src/main';
import {MonitorService} from '../src/monitor';
import {StorageService} from '../src/storage';
async function until(check:()=>Promise<boolean>|boolean,timeout=10000) {
 const deadline=Date.now()+timeout;while(Date.now()<deadline){if(await check())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Recovery timed out');
}
test('broker unavailable/reconnect, stale telemetry, retired boot and database outage/recovery',async()=>{
 assert.ok(process.env.DATABASE_URL);assert.ok(process.env.GAS_TEST_DB_CONTAINER);
 process.env.MIGRATE_ON_START='true';process.env.NOTIFICATIONS_ENABLED='false';process.env.STALE_AFTER_MS='250';
 let broker=new Aedes();let tcp=createServer(broker.handle);
 await new Promise<void>(r=>tcp.listen(0,'127.0.0.1',r));const port=(tcp.address() as {port:number}).port;
 process.env.MQTT_URL=`mqtt://127.0.0.1:${port}`;
 const app=await createApp();await app.listen(0,'127.0.0.1');const monitor=app.get(MonitorService);const store=app.get(StorageService);
 const pub=connect(process.env.MQTT_URL,{reconnectPeriod:100});
 const sample={version:1 as const,deviceId:'fault-test',bootId:'0123456789abcdef',sequence:1,uptimeMs:1,rawAdc:3000,state:'DANGER' as const,previousState:'SAFE' as const,fanOn:true,simulated:true};
 const topic='gas-monitor/device/fault-test/telemetry';
 try {
  await until(()=>monitor.mqttConnected && pub.connected);
  await pub.publishAsync(topic,JSON.stringify(sample),{qos:1});await until(()=>monitor.getDevices().length===1);
  await new Promise<void>(r=>broker.close(()=>r()));await new Promise<void>(r=>tcp.close(()=>r()));
  await until(()=>!monitor.mqttConnected);await until(()=>!monitor.getDevices()[0].online);
  assert.equal((await monitor.getReadings('fault-test',10)).length,1);
  broker=new Aedes();tcp=createServer(broker.handle);await new Promise<void>(r=>tcp.listen(port,'127.0.0.1',r));
  await until(()=>monitor.mqttConnected && pub.connected);
  await pub.publishAsync(topic,JSON.stringify({...sample,bootId:'fedcba9876543210'}),{qos:1});
  await until(()=>monitor.getDevices()[0].latest?.bootId==='fedcba9876543210');
  await monitor.ingest(topic,Buffer.from(JSON.stringify({...sample,sequence:2})));
  assert.equal(monitor.getDevices()[0].latest?.bootId,'fedcba9876543210');
  execFileSync('docker',['pause',process.env.GAS_TEST_DB_CONTAINER!],{stdio:'ignore'});
  assert.equal((await monitor.health()).storageAvailable,false);
  await assert.rejects(()=>store.history('fault-test',10));
  execFileSync('docker',['unpause',process.env.GAS_TEST_DB_CONTAINER!],{stdio:'ignore'});
  await until(()=>store.available());
  assert.equal((await monitor.health()).status,'ok');
  assert.equal((await store.history('fault-test',10)).length,2);
 }finally {
  try{execFileSync('docker',['unpause',process.env.GAS_TEST_DB_CONTAINER!],{stdio:'ignore'});}catch{}
  await pub.endAsync(true);await app.close();await new Promise<void>(r=>tcp.close(()=>r()));await new Promise<void>(r=>broker.close(()=>r()));
 }
});
