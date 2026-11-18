import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment} from '../src/config';
test('reject invalid numeric and boolean runtime configuration',()=>{
 for(const [key,value] of [['PORT','0'],['STALE_AFTER_MS','NaN'],['NOTIFICATION_COOLDOWN_MS','-1'],['NOTIFICATIONS_ENABLED','yes']]){
  const previous=process.env[key];process.env[key]=value;
  try{assert.throws(()=>validateEnvironment());}finally{if(previous===undefined)delete process.env[key];else process.env[key]=previous;}
 }
});
