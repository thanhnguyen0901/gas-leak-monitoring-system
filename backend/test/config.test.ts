import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment} from '../src/config';
test('reject invalid numeric and boolean runtime configuration',()=>{
 for(const [key,value] of [['PORT','0'],['STALE_AFTER_MS','NaN'],['NOTIFICATION_COOLDOWN_MS','-1'],['NOTIFICATIONS_ENABLED','yes']]){
  const previous=process.env[key];process.env[key]=value;
  try{assert.throws(()=>validateEnvironment());}finally{if(previous===undefined)delete process.env[key];else process.env[key]=previous;}
 }
});

import {databaseOptions} from '../src/database';
test('database TLS verification cannot be weakened by URL sslmode; migration/runtime share options',()=>{
 const oldUrl=process.env.DATABASE_URL,oldSsl=process.env.DATABASE_SSL;
 try{
  process.env.DATABASE_URL='postgres://example.invalid/test?sslmode=no-verify';process.env.DATABASE_SSL='true';
  const options=databaseOptions();assert.deepEqual(options.ssl,{rejectUnauthorized:true});assert.equal(new URL(options.connectionString!).searchParams.has('sslmode'),false);
 }finally{if(oldUrl===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldUrl;if(oldSsl===undefined)delete process.env.DATABASE_SSL;else process.env.DATABASE_SSL=oldSsl;}
});
