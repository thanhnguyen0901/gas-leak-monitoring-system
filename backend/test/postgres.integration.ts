import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from '../src/storage';
test('real PostgreSQL migration, idempotence, constraints, history and restart', async () => {
  assert.ok(process.env.DATABASE_URL,'Set an isolated test DATABASE_URL'); process.env.MIGRATE_ON_START='true';
  const storage=new StorageService(); await storage.ready();
  const sample={version:1 as const,deviceId:'db-test',bootId:'0123456789abcdef',sequence:1,uptimeMs:500,rawAdc:3000,state:'DANGER' as const,previousState:'SAFE' as const,fanOn:true,simulated:true,receivedAt:new Date().toISOString()};
  try {
    assert.equal(await storage.saveReading(sample),true); assert.equal(await storage.saveReading(sample),false);
    assert.equal((await storage.history('db-test',10)).length,1);
    const alert={...sample,id:'db-test:0123456789abcdef:1',recovery:false};
    assert.equal(await storage.saveAlert(alert),true); assert.equal(await storage.saveAlert(alert),false);
    assert.equal((await storage.alertHistory('db-test',10)).length,1);
    await assert.rejects(()=>storage.saveReading({...sample,sequence:2,rawAdc:5000}));
  } finally { await storage.onModuleDestroy(); }
  const restarted=new StorageService(); await restarted.ready();
  try { assert.equal((await restarted.history('db-test',10))[0].rawAdc,3000); assert.equal((await restarted.loadDevices())[0].id,'db-test'); }
  finally { await restarted.onModuleDestroy(); }
});
