import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeReadings, mergeAlerts, effectiveOnline, type Reading } from '../src/data.ts';
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
