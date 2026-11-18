import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Alert, Reading } from './contracts';
export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(48392715)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const exists=await client.query("SELECT version FROM schema_migrations WHERE version='001_initial'");
    if (!exists.rowCount) {
      await client.query(await readFile(resolve(__dirname,'../../migrations/001_initial.sql'),'utf8'));
      await client.query("INSERT INTO schema_migrations(version) VALUES ('001_initial')");
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
@Injectable()
export class StorageService implements OnModuleDestroy {
  pool?: Pool;
  private opening?: Promise<void>;
  ready() { return this.opening ??= this.open(); }
  private async open() {
    if (!process.env.DATABASE_URL) return;
    this.pool=new Pool({ connectionString:process.env.DATABASE_URL, max:5, connectionTimeoutMillis:3000, query_timeout:5000,
      ssl:process.env.DATABASE_SSL==='true' ? {rejectUnauthorized:true} : undefined });
    this.pool.on('error',()=>{ /* Requests/ingestion report failures; do not crash on idle disconnect. */ });
    if (process.env.MIGRATE_ON_START==='true') await migrate(this.pool);
    await this.pool.query('SELECT id FROM devices LIMIT 1');
  }
  async loadDevices() { return this.pool ? (await this.pool.query('SELECT id, last_seen, latest FROM devices')).rows : []; }
  async saveReading(reading: Reading) {
    if (!this.pool) return true;
    const c=await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('INSERT INTO devices(id) VALUES ($1) ON CONFLICT DO NOTHING',[reading.deviceId]);
      const result=await c.query('INSERT INTO gas_readings(device_id,boot_id,sequence,raw_adc,state,received_at,payload) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING sequence',
        [reading.deviceId,reading.bootId,reading.sequence,reading.rawAdc,reading.state,reading.receivedAt,reading]);
      if (result.rowCount) await c.query('UPDATE devices SET last_seen=$2,latest=$3 WHERE id=$1 AND (latest IS NULL OR last_seen <= $2)',[reading.deviceId,reading.receivedAt,reading]);
      await c.query('COMMIT'); return Boolean(result.rowCount);
    } catch (error) { await c.query('ROLLBACK'); throw error; }
    finally { c.release(); }
  }
  async saveAlert(alert: Alert) {
    if (!this.pool) return true;
    const c=await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('INSERT INTO devices(id) VALUES ($1) ON CONFLICT DO NOTHING',[alert.deviceId]);
      const result=await c.query('INSERT INTO alerts(id,device_id,received_at,recovery,payload) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id',[alert.id,alert.deviceId,alert.receivedAt,alert.recovery,alert]);
      await c.query('COMMIT'); return Boolean(result.rowCount);
    } catch(error) { await c.query('ROLLBACK'); throw error; }
    finally { c.release(); }
  }
  async history(id: string, limit: number) { return (await this.pool!.query('SELECT payload FROM gas_readings WHERE device_id=$1 ORDER BY received_at DESC LIMIT $2',[id,limit])).rows.map(r=>r.payload); }
  async alertHistory(id: string | undefined, limit: number) { return (await this.pool!.query('SELECT payload FROM alerts WHERE ($1::text IS NULL OR device_id=$1) ORDER BY received_at DESC LIMIT $2',[id??null,limit])).rows.map(r=>r.payload); }
  async onModuleDestroy() { await this.pool?.end(); }
}
