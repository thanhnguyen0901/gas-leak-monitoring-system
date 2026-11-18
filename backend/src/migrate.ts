import { Pool } from 'pg';
import { migrate } from './storage';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before migrating');
const pool = new Pool({connectionString:process.env.DATABASE_URL});
migrate(pool).then(()=>console.log('Database migration applied')).finally(()=>pool.end()).catch(()=>{console.error('Migration failed');process.exitCode=1;});
