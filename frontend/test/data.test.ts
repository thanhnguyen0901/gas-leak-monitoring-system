import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadings, mergeAlerts, effectiveOnline, sensorAttention, serviceWarnings, type ServiceHealth, type Reading } from '../src/data.ts';
const r:Reading={version:1,deviceId:'a',bootId:'0123456789abcdef',sequence:1,uptimeMs:1,rawAdc:0,state:'SAFE',previousState:'SAFE',fanOn:false,simulated:true,receivedAt:'2026-11-18T00:00:00Z'};
test('history merges concurrent HTTP/socket data without duplicates; preserves reboot identity and time order',()=>{
 const newer={...r,sequence:2,receivedAt:'2026-11-18T00:00:01Z'};
 assert.deepEqual(mergeReadings([newer],[r,newer]),[r,newer]);
 assert.equal(mergeReadings([r],[{...r,bootId:'fedcba9876543210'}]).length,2);
 assert.equal(mergeReadings([r],[newer],1)[0].sequence,2);
});
test('alerts deduplicate; disconnected backend never reports current online status',()=>{
 const a={...r,id:'a:1',recovery:true};assert.equal(mergeAlerts([a],[a]).length,1);
 const d={id:'a',latest:r,lastSeen:r.receivedAt,online:true};assert.equal(effectiveOnline(d,false),false);assert.equal(effectiveOnline(d,true),true);
});

test('sensor readiness is explicit and legacy readings remain compatible',()=>{
 assert.equal(sensorAttention(r),false);
 assert.equal(sensorAttention({...r,sensorStatus:'WARMING_UP'}),true);
 assert.equal(sensorAttention({...r,sensorStatus:'LOW_RAIL'}),true);
 assert.equal(sensorAttention({...r,sensorStatus:'VERIFYING_SIGNAL'}),true);
 assert.equal(sensorAttention({...r,sensorStatus:'OK'}),false);
});

test('service failures and memory mode stay visible; stale health never appears healthy',()=>{
 const health:ServiceHealth={status:'ok',storage:'memory',storageAvailable:true,mqttConnected:false,invalidMessages:0,droppedMessages:2,notifications:{enabled:true,failed:1}};
 assert.equal(serviceWarnings(health,true).length,4);
 assert.match(serviceWarnings(health,false)[0],/Chưa xác nhận/);
 assert.equal(serviceWarnings({...health,storage:'postgresql',mqttConnected:true,droppedMessages:0,notifications:{enabled:true,failed:0}},true).length,0);
});
