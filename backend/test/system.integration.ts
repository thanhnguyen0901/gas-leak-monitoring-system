import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import Aedes from 'aedes';
import {connect} from 'mqtt';
import {io} from 'socket.io-client';
import {createApp} from '../src/main';
import {TelegramService,NotificationQueue} from '../src/telegram';
async function until(check:()=>Promise<boolean>|boolean) {
 const deadline=Date.now()+5000;while(Date.now()<deadline){if(await check())return;await new Promise(r=>setTimeout(r,25));}throw new Error('Integration timeout');
}
test('synthetic device → MQTT → NestJS → PostgreSQL → REST/WebSocket → mock Telegram',async()=>{
 assert.ok(process.env.DATABASE_URL,'Use isolated PostgreSQL runner');
 process.env.MIGRATE_ON_START='true';process.env.NOTIFICATIONS_ENABLED='true';
 process.env.TELEGRAM_BOT_TOKEN='test-only-not-a-real-token';process.env.TELEGRAM_CHAT_ID='test-only';
 const broker=new Aedes();const tcp=createServer(broker.handle);await new Promise<void>(r=>tcp.listen(0,'127.0.0.1',r));
 process.env.MQTT_URL=`mqtt://127.0.0.1:${(tcp.address() as {port:number}).port}`;
 const app=await createApp();const telegram=app.get(TelegramService);const messages:string[]=[];
 telegram.transport=async text=>{messages.push(text);};
 await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 const publisher=connect(process.env.MQTT_URL);
 const acks:string[]=[];publisher.on('message',(topic,body)=>{if(topic.endsWith('/ack'))acks.push(body.toString());});const socket=io(base,{transports:['websocket']});let broadcasts=0;socket.on('reading',()=>broadcasts++);
 try {
  await until(async()=> (await (await fetch(base+'/api/health')).json()).mqttConnected && socket.connected);
  await publisher.subscribeAsync('gas-monitor/device/system-test/ack');
  const states=['SAFE','WARNING','DANGER','SAFE'];const raws=[0,1500,3000,0];
  for(let i=0;i<states.length;i++){
   const sample={version:1,deviceId:'system-test',bootId:'0123456789abcdef',sequence:i+1,uptimeMs:i*500,rawAdc:raws[i],state:states[i],previousState:states[Math.max(0,i-1)],fanOn:states[i]!=='SAFE',simulated:true};
   await publisher.publishAsync('gas-monitor/device/system-test/telemetry',JSON.stringify(sample),{qos:1});
   if(i)await publisher.publishAsync('gas-monitor/device/system-test/alert',JSON.stringify(sample),{qos:1});
  }
  await until(async()=> (await (await fetch(base+'/api/devices/system-test/readings')).json()).length===4);
  await until(()=>messages.length===3&&acks.length===3);
  assert.deepEqual(acks.map(a=>JSON.parse(a).eventId).sort(),['0123456789abcdef:2','0123456789abcdef:3','0123456789abcdef:4']);
  const duplicate={version:1,deviceId:'system-test',bootId:'0123456789abcdef',sequence:4,uptimeMs:1500,rawAdc:0,state:'SAFE',previousState:'DANGER',fanOn:false,simulated:true};
  await publisher.publishAsync('gas-monitor/device/system-test/alert',JSON.stringify(duplicate),{qos:1});
  await until(()=>acks.length===4);assert.equal(messages.length,3);
  assert.ok(broadcasts>=4);assert.match(messages[0],/^WARNING/);assert.match(messages[1],/^DANGER/);assert.match(messages[2],/^RECOVERY/);
  const alerts=await (await fetch(base+'/api/alerts?deviceId=system-test')).json();assert.equal(alerts.length,3);assert.equal(alerts[0].recovery,true);
  const devices=await (await fetch(base+'/api/devices')).json();assert.equal(devices.find((d:any)=>d.id==='system-test').latest.state,'SAFE');
 }finally{socket.close();await publisher.endAsync(true);await app.close();await new Promise<void>(r=>tcp.close(()=>r()));await new Promise<void>(r=>broker.close(()=>r()));}
});
