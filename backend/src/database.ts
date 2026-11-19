import { PoolConfig } from 'pg';
export function databaseOptions(): PoolConfig {
  return { connectionString:process.env.DATABASE_URL, max:5, connectionTimeoutMillis:3000,
    query_timeout:5000, statement_timeout:5000,
    ssl:process.env.DATABASE_SSL==='true' ? {rejectUnauthorized:true} : undefined };
}
