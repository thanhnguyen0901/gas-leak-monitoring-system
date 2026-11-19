import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/main';
import {MonitorService} from '../src/monitor';
import {TelegramService} from '../src/telegram';
test('quality-only transitions are stored/notified and never described as confirmed gas concentration',async()=>{
 process.env.MQTT_URL='';process.env.DATABASE_URL='';process.env.NOTIFICATIONS_ENABLED='true';process.env.TELEGRAM_BOT_TOKEN='synthetic-test';process.env.TELEGRAM_CHAT_ID='synthetic-test';
 const app=await createApp();const telegram=app.get(TelegramService);const messages:string[]=[];telegram.transport=async text=>{messages.push(text);};await app.init();
 const monitor=app.get(MonitorService);
 const warm={version:1,deviceId:'quality-test',bootId:'0123456789abcdef',sequence:1,uptimeMs:0,rawAdc:1000,state:'DANGER',previousState:'SAFE',fanOn:true,simulated:true,sensorStatus:'WARMING_UP',previousSensorStatus:'OK'};
 try{
  await monitor.ingest('gas-monitor/device/quality-test/alert',Buffer.from(JSON.stringify(warm)));await telegram.tick();assert.match(messages[0],/^SENSOR WARMING_UP/);
  const ready={...warm,sequence:2,rawAdc:3000,previousState:'DANGER',sensorStatus:'OK',previousSensorStatus:'WARMING_UP'};
  await monitor.ingest('gas-monitor/device/quality-test/alert',Buffer.from(JSON.stringify(ready)));await telegram.tick();assert.match(messages[1],/^DANGER/);
  assert.equal((await monitor.getAlerts('quality-test',10)).length,2);
 }finally{await app.close();}
});
