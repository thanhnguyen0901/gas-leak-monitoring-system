import { Alert } from './contracts';
export type NotificationPolicy = { active?: string; lastSent: Record<string,number> };
export const emptyPolicy = ():NotificationPolicy => ({lastSent:{}});
export function shouldNotify(a:Alert,p:NotificationPolicy,now:number,cooldown:number) {
  if(a.recovery)return Boolean(p.active);
  if(a.state==='DANGER' && p.active!=='DANGER')return true;
  return now-(p.lastSent[a.state]??-Infinity)>=cooldown;
}
export function deliveredPolicy(a:Alert,p:NotificationPolicy,now:number):NotificationPolicy {
  return {active:a.recovery?undefined:a.state,lastSent:{...p.lastSent,[a.state]:now}};
}
export function notificationText(a:Alert) {
  return `${a.recovery?'RECOVERY':a.state} | ${a.deviceId}\nRaw ADC: ${a.rawAdc} (${a.simulated?'simulated':'uncalibrated raw'})\nFan: ${a.fanOn?'ON':'OFF'}\nReceived: ${a.receivedAt}\nEvent: ${a.id}`;
}
export class RetryableDeliveryError extends Error {
  constructor(public retryAfterMs=1000) {super('Notification delivery failed');}
}
export function retryDelay(error:unknown,attempt:number) {
  const requested=error instanceof RetryableDeliveryError && Number.isFinite(error.retryAfterMs) ? error.retryAfterMs : 0;
  return Math.min(86400000,Math.max(Math.min(30000,1000*2**attempt),requested));
}
