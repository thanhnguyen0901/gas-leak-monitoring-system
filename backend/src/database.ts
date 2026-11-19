import { PoolConfig } from 'pg';
export function databaseOptions(): PoolConfig {
  let connectionString=process.env.DATABASE_URL;
  const verifyTls=process.env.DATABASE_SSL==='true';
  // URL sslmode can override pg's explicit ssl object. Keep a single strict policy.
  if(connectionString&&verifyTls){
    const url=new URL(connectionString);
    for(const key of ['sslmode','ssl','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
    connectionString=url.toString();
  }
  return {connectionString,max:5,connectionTimeoutMillis:3000,query_timeout:5000,statement_timeout:5000,
    ssl:verifyTls?{rejectUnauthorized:true}:undefined};
}
