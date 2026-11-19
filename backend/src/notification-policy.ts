import { Alert } from './contracts';
export type NotificationPolicy = { active?: string; activeSensor?:string; observedUnsafe?:boolean; lastSent: Record<string,number> };
export const emptyPolicy = ():NotificationPolicy => ({lastSent:{}});
const notificationKey=(a:Alert)=>a.sensorStatus&&a.sensorStatus!=='OK'?`SENSOR_${a.sensorStatus}`:a.state;
export function shouldNotify(a:Alert,p:NotificationPolicy,now:number,cooldown:number) {
  if(a.recovery)return p.observedUnsafe!==false&&(Boolean(p.active)||a.previousState!=='SAFE'||(a.previousSensorStatus??'OK')!=='OK');
  const sensor=a.sensorStatus??'OK';
  if(sensor!=='OK'&&p.activeSensor!==sensor)return true;
  if(sensor==='OK'&&p.activeSensor&&p.activeSensor!=='OK')return true;
  if(a.state==='DANGER' && (p.active!=='DANGER'||p.observedUnsafe===false))return true;
  return now-(p.lastSent[notificationKey(a)]??-Infinity)>=cooldown;
}
export function observedPolicy(a:Alert,p:NotificationPolicy,terminal:boolean):NotificationPolicy {
  return {...p,observedUnsafe:a.recovery?(terminal?false:p.observedUnsafe):true};
}
export function deliveredPolicy(a:Alert,p:NotificationPolicy,now:number):NotificationPolicy {
  return {...observedPolicy(a,p,true),active:a.recovery?undefined:a.state,activeSensor:a.recovery?undefined:(a.sensorStatus??'OK'),lastSent:{...p.lastSent,[notificationKey(a)]:now}};
}
export function notificationText(a:Alert) {
  const title=a.sensorStatus&&a.sensorStatus!=='OK'?`SENSOR ${a.sensorStatus} / ${a.state}`:a.recovery?'RECOVERY':a.state;
  return `${title} | ${a.deviceId}\nRaw ADC: ${a.rawAdc} (${a.simulated?'simulated':'uncalibrated raw'})\nSensor: ${a.sensorStatus??'OK'}\nFan: ${a.fanOn?'ON':'OFF'}\nReceived: ${a.receivedAt}\nEvent: ${a.id}`;
}
export class RetryableDeliveryError extends Error {
  constructor(public retryAfterMs=1000) {super('Notification delivery failed');}
}
export function retryDelay(error:unknown,attempt:number) {
  const requested=error instanceof RetryableDeliveryError && Number.isFinite(error.retryAfterMs) ? error.retryAfterMs : 0;
  return Math.min(86400000,Math.max(Math.min(30000,1000*2**attempt),requested));
}
