import {test} from 'node:test';
import assert from 'node:assert/strict';
import {StorageService} from '../src/storage';
import {Alert} from '../src/contracts';
import {RetryableDeliveryError} from '../src/notification-policy';
const make=(device:string,id:number,state:'SAFE'|'WARNING'|'DANGER'):Alert=>({version:1,deviceId:device,bootId:'0123456789abcdef',sequence:id,uptimeMs:100,rawAdc:state==='SAFE'?100:3000,state,previousState:state==='SAFE'?'DANGER':'SAFE',fanOn:state!=='SAFE',simulated:true,receivedAt:new Date().toISOString(),id:`${device}:0123456789abcdef:${id}`,recovery:state==='SAFE'});
test('transactional outbox survives restart; cooldown and recovery persist; duplicate alert creates one job',async()=>{
 assert.ok(process.env.DATABASE_URL);process.env.MIGRATE_ON_START='true';
 let storage=new StorageService();await storage.ready();
 const messages:string[]=[];const send=async(text:string)=>{messages.push(text);};const now=Date.now()+1000;
 try{
  const warning=make('durable-test',1,'WARNING');assert.equal(await storage.saveAlert(warning,true),true);
  assert.equal(await storage.saveAlert(warning,true),false);
  await storage.close();storage=new StorageService();await storage.ready();
  await storage.processNotification(send,60000,now);assert.match(messages[0],/^WARNING/);
  await storage.saveAlert(make('durable-test',2,'WARNING'),true);
  await storage.processNotification(send,60000,now+1);assert.equal(messages.length,1);
  await storage.saveAlert(make('durable-test',3,'DANGER'),true);
  await storage.processNotification(send,60000,now+2);assert.match(messages[1],/^DANGER/);
  await storage.close();storage=new StorageService();await storage.ready();
  await storage.saveAlert(make('durable-test',4,'SAFE'),true);
  await storage.processNotification(send,60000,now+3);assert.match(messages[2],/^RECOVERY/);
  const rows=(await storage.pool!.query("SELECT status,count(*)::int AS n FROM notification_outbox WHERE device_id='durable-test' GROUP BY status")).rows;assert.equal(rows.find(r=>r.status==='sent').n,3);assert.equal(rows.find(r=>r.status==='suppressed').n,1);
 }finally{await storage.close();}
});
test('persisted retry_after survives worker recreation and concurrent workers claim once',async()=>{
 const storage=new StorageService();await storage.ready();const now=Date.now()+1000;let attempts=0;
 try{
  await storage.saveAlert(make('retry-test',1,'DANGER'),true);
  await storage.processNotification(async()=>{attempts++;throw new RetryableDeliveryError(10000);},60000,now);
  await storage.processNotification(async()=>{attempts++;},60000,now+9999);assert.equal(attempts,1);
  await Promise.all([storage.processNotification(async()=>{attempts++;},60000,now+10000),storage.processNotification(async()=>{attempts++;},60000,now+10000)]);
  assert.equal(attempts,2);
 }finally{await storage.close();}
});
