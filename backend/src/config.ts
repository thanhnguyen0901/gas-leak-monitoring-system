export function validateEnvironment() {
  for (const [key,min,max] of [['PORT',1,65535],['STALE_AFTER_MS',50,86400000],['NOTIFICATION_COOLDOWN_MS',0,86400000]] as const) {
    const value=process.env[key];
    if(value!==undefined && (!/^\d+$/.test(value)||Number(value)<min||Number(value)>max)) throw new Error(`Invalid ${key}`);
  }
  for(const key of ['DATABASE_SSL','MIGRATE_ON_START','NOTIFICATIONS_ENABLED'])
    if(process.env[key]!==undefined&&!['true','false'].includes(process.env[key]!))throw new Error(`Invalid ${key}`);
  if(process.env.MQTT_URL&&!/^mqtts?:\/\//.test(process.env.MQTT_URL))throw new Error('Invalid MQTT_URL');
}
