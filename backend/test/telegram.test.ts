import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationQueue,RetryableDeliveryError } from '../src/telegram';
import { Alert } from '../src/contracts';
const make=(id:string,state:'SAFE'|'WARNING'|'DANGER'):Alert=>({version:1,deviceId:'notify-test',bootId:'0123456789abcdef',sequence:Number(id),uptimeMs:0,rawAdc:state==='SAFE'?0:3000,state,previousState:state==='SAFE'?'DANGER':'SAFE',fanOn:state!=='SAFE',simulated:true,id,recovery:state==='SAFE',receivedAt:'2026-11-18T00:00:00Z'});
test('warning, danger escalation, recovery, duplicate pending events and cooldown',async()=>{
 const sent:string[]=[];const q=new NotificationQueue(async text=>{sent.push(text);},60000);
 q.enqueue(make('1','WARNING'));q.enqueue(make('1','WARNING'));await q.tick(0);assert.equal(sent.length,1);
 q.enqueue(make('2','WARNING'));await q.tick(1);assert.equal(sent.length,1);
 q.enqueue(make('3','DANGER'));await q.tick(2);assert.equal(sent.length,2);
 q.enqueue(make('4','SAFE'));await q.tick(3);assert.match(sent[2],/^RECOVERY/);
 q.enqueue(make('5','SAFE'));await q.tick(4);assert.equal(sent.length,3);
 q.enqueue(make('6','WARNING'));await q.tick(60000);assert.equal(sent.length,4);
});
test('delivery errors retry without blocking ingestion; rate-limit retry_after respected',async()=>{
 let attempts=0;const q=new NotificationQueue(async()=>{if(++attempts===1)throw new RetryableDeliveryError(10000);});
 q.enqueue(make('1','DANGER'));await q.tick(0);assert.equal(q.size,1);
 await q.tick(9999);assert.equal(attempts,1);await q.tick(10000);assert.equal(q.delivered,1);
});
test('bounded queue and failed delivery limit',async()=>{
 const q=new NotificationQueue(async()=>{throw new Error('offline');});
 for(let i=0;i<257;i++)q.enqueue(make(String(i),'DANGER'));assert.equal(q.size,256);assert.equal(q.dropped,1);
 for(const t of [0,2000,6000,14000,30000])await q.tick(t);assert.equal(q.dropped,2);
});

test('new danger after delivered recovery bypasses the previous incident cooldown',async()=>{
 const sent:string[]=[];const q=new NotificationQueue(async text=>{sent.push(text);},60000);
 q.enqueue(make('1','DANGER'));await q.tick(0);
 q.enqueue(make('2','SAFE'));await q.tick(1);
 q.enqueue(make('3','DANGER'));await q.tick(2);
 assert.equal(sent.length,3);assert.match(sent[2],/^DANGER/);
});

test('quality-only change sends sensor reason and later trusted gas danger despite cooldown',async()=>{
 const sent:string[]=[];const q=new NotificationQueue(async text=>{sent.push(text);},60000);
 const fault={...make('1','DANGER'),sensorStatus:'WARMING_UP' as const,previousSensorStatus:'OK' as const};
 q.enqueue(fault);await q.tick(0);assert.match(sent[0],/^SENSOR WARMING_UP/);
 q.enqueue({...make('2','DANGER'),previousState:'DANGER',sensorStatus:'OK',previousSensorStatus:'WARMING_UP'});await q.tick(1);assert.match(sent[1],/^DANGER/);
});

test('recovery is delivered even if all unsafe notification attempts failed',async()=>{
 const sent:string[]=[];const q=new NotificationQueue(async text=>{if(text.startsWith('DANGER'))throw new Error('offline');sent.push(text);});
 q.enqueue(make('1','DANGER'));for(const t of [0,2000,6000,14000,30000])await q.tick(t);
 assert.equal(q.dropped,1);q.enqueue(make('2','SAFE'));await q.tick(30001);assert.match(sent[0],/^RECOVERY/);
});
