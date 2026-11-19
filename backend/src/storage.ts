import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Alert, Reading } from './contracts';
import { databaseOptions } from './database';
import { emptyPolicy, shouldNotify, deliveredPolicy, notificationText, observedPolicy, retryDelay } from './notification-policy';
import { createHash } from 'node:crypto';
export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(48392715)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    await client.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text');
    const directory=resolve(__dirname,'../../migrations');
    for(const name of (await readdir(directory)).filter(n=>/^\d+_[a-z_]+\.sql$/.test(n)).sort()) {
      const version=name.slice(0,-4), sql=await readFile(resolve(directory,name),'utf8');
      const checksum=createHash('sha256').update(sql).digest('hex');
      const applied=await client.query('SELECT checksum FROM schema_migrations WHERE version=$1',[version]);
      if(applied.rowCount) {
        if(applied.rows[0].checksum && applied.rows[0].checksum!==checksum)throw new Error('Applied migration checksum mismatch');
        await client.query('UPDATE schema_migrations SET checksum=$2 WHERE version=$1 AND checksum IS NULL',[version,checksum]);
      } else {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version,checksum) VALUES ($1,$2)',[version,checksum]);
      }
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
@Injectable()
export class StorageService implements OnApplicationShutdown {
  pool?: Pool;
  private opening?: Promise<void>;
  ready() { return this.opening ??= this.open(); }
  private async open() {
    if (!process.env.DATABASE_URL) return;
    this.pool=new Pool(databaseOptions());
    this.pool.on('error',()=>{ /* Requests/ingestion report failures; do not crash on idle disconnect. */ });
    if (process.env.MIGRATE_ON_START==='true') await migrate(this.pool);
    await this.pool.query('SELECT id FROM devices LIMIT 1');
  }
  async available() {
    if (!this.pool) return true;
    try { await this.pool.query('SELECT 1'); return true; } catch { return false; }
  }
  async knownBoot(id:string,boot:string) {
    return this.pool ? Boolean((await this.pool.query('SELECT 1 FROM gas_readings WHERE device_id=$1 AND boot_id=$2 LIMIT 1',[id,boot])).rowCount) : false;
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
  async saveAlert(alert: Alert, notify=false) {
    if (!this.pool) return true;
    const c=await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('INSERT INTO devices(id) VALUES ($1) ON CONFLICT DO NOTHING',[alert.deviceId]);
      const result=await c.query('INSERT INTO alerts(id,device_id,received_at,recovery,payload) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id',[alert.id,alert.deviceId,alert.receivedAt,alert.recovery,alert]);
      if(result.rowCount && notify)await c.query('INSERT INTO notification_outbox(alert_id,device_id) VALUES ($1,$2)',[alert.id,alert.deviceId]);
      await c.query('COMMIT'); return Boolean(result.rowCount);
    } catch(error) { await c.query('ROLLBACK'); throw error; }
    finally { c.release(); }
  }
  async history(id: string, limit: number) { return (await this.pool!.query('SELECT payload FROM gas_readings WHERE device_id=$1 ORDER BY received_at DESC, sequence DESC LIMIT $2',[id,limit])).rows.map(r=>r.payload); }
  async alertHistory(id: string | undefined, limit: number) { return (await this.pool!.query('SELECT payload FROM alerts WHERE ($1::text IS NULL OR device_id=$1) ORDER BY received_at DESC, (payload->>\'sequence\')::bigint DESC LIMIT $2',[id??null,limit])).rows.map(r=>r.payload); }
  async notificationStats() {
    if(!this.pool)return null;
    const rows=(await this.pool.query('SELECT status,count(*)::int AS count FROM notification_outbox GROUP BY status')).rows;
    const counts={pending:0,sent:0,suppressed:0,failed:0};
    for(const row of rows)counts[row.status as keyof typeof counts]=row.count;
    return counts;
  }
  async processNotification(send:(text:string)=>Promise<void>,cooldown:number,now=Date.now()) {
    if(!this.pool)return false;
    const c=await this.pool.connect();
    try {
      await c.query('BEGIN');
      const selected=await c.query(`SELECT q.*,a.payload FROM notification_outbox q JOIN alerts a ON a.id=q.alert_id
        WHERE q.status='pending' AND q.next_attempt_at <= $1 AND NOT EXISTS (
          SELECT 1 FROM notification_outbox earlier WHERE earlier.device_id=q.device_id AND earlier.status='pending' AND earlier.ordinal<q.ordinal
        ) ORDER BY q.ordinal LIMIT 1 FOR UPDATE OF q SKIP LOCKED`,[new Date(now)]);
      if(!selected.rowCount){await c.query('COMMIT');return false;}
      const job=selected.rows[0], alert=job.payload as Alert;
      await c.query('INSERT INTO notification_state(device_id) VALUES ($1) ON CONFLICT DO NOTHING',[alert.deviceId]);
      const state=(await c.query('SELECT policy FROM notification_state WHERE device_id=$1 FOR UPDATE',[alert.deviceId])).rows[0].policy??emptyPolicy();
      if(!shouldNotify(alert,state,now,cooldown)) {
        await c.query('UPDATE notification_state SET policy=$2,updated_at=$3 WHERE device_id=$1',[alert.deviceId,observedPolicy(alert,state,true),new Date(now)]);
        await c.query("UPDATE notification_outbox SET status='suppressed',finished_at=$2 WHERE ordinal=$1",[job.ordinal,new Date(now)]);
      } else {
        let deliveryError:unknown,delivered=false;
        try {await send(notificationText(alert));delivered=true;}catch(error){deliveryError=error;}
        if(delivered) {
          await c.query('UPDATE notification_state SET policy=$2,updated_at=$3 WHERE device_id=$1',[alert.deviceId,deliveredPolicy(alert,state,now),new Date(now)]);
          await c.query("UPDATE notification_outbox SET status='sent',attempts=attempts+1,finished_at=$2 WHERE ordinal=$1",[job.ordinal,new Date(now)]);
        } else {
          const attempts=job.attempts+1;
          await c.query('UPDATE notification_state SET policy=$2,updated_at=$3 WHERE device_id=$1',[alert.deviceId,observedPolicy(alert,state,attempts>=5),new Date(now)]);
          await c.query('UPDATE notification_outbox SET attempts=$2,status=$3,next_attempt_at=$4,finished_at=$5 WHERE ordinal=$1',
            [job.ordinal,attempts,attempts>=5?'failed':'pending',new Date(now+retryDelay(deliveryError,attempts)),attempts>=5?new Date(now):null]);
        }
      }
      await c.query('COMMIT');return true;
    }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
  async close() { await this.pool?.end(); }
  async onApplicationShutdown(){await this.close();}

}
