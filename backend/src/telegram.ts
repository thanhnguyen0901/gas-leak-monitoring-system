import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Alert } from './contracts';
export class RetryableDeliveryError extends Error {
  constructor(public retryAfterMs=1000) { super('Notification delivery failed'); }
}
export class NotificationQueue {
  private pending: {alert:Alert;attempts:number;next:number}[]=[];
  private queuedIds=new Set<string>();
  private sent=new Map<string,number>();
  private active=new Map<string,string>();
  private busy=false;
  dropped=0;
  delivered=0;
  constructor(private readonly send:(text:string)=>Promise<void>,private readonly cooldown=60000) {}
  enqueue(alert:Alert) {
    if(this.queuedIds.has(alert.id))return;
    if(this.pending.length>=256){this.dropped++;return;}
    this.queuedIds.add(alert.id);this.pending.push({alert,attempts:0,next:0});
  }
  async tick(now=Date.now()) {
    if(this.busy)return;
    const item=this.pending[0];if(!item||item.next>now)return;
    const a=item.alert,key=`${a.deviceId}:${a.state}`;
    const shouldSend=a.recovery ? this.active.has(a.deviceId) :
      (a.state==='DANGER' && this.active.get(a.deviceId)==='WARNING') || now-(this.sent.get(key)??-Infinity)>=this.cooldown;
    if(!shouldSend){this.remove();return;}
    this.busy=true;
    try {
      await this.send(`${a.recovery?'RECOVERY':a.state} | ${a.deviceId}\nRaw ADC: ${a.rawAdc} (${a.simulated?'simulated':'uncalibrated raw'})\nFan: ${a.fanOn?'ON':'OFF'}\nReceived: ${a.receivedAt}\nEvent: ${a.id}`);
      this.sent.set(key,now);
      if(a.recovery)this.active.delete(a.deviceId);else this.active.set(a.deviceId,a.state);
      if(this.sent.size>3000)this.sent.delete(this.sent.keys().next().value!);
      if(this.active.size>1000)this.active.delete(this.active.keys().next().value!);
      this.delivered++;this.remove();
    } catch(error) {
      item.attempts++;
      if(item.attempts>=5){this.dropped++;this.remove();}
      else item.next=now+Math.max(Math.min(30000,1000*2**item.attempts),error instanceof RetryableDeliveryError ? error.retryAfterMs : 0);
    } finally {this.busy=false;}
  }
  private remove(){const item=this.pending.shift();if(item)this.queuedIds.delete(item.alert.id);}
  get size(){return this.pending.length;}
}
export async function sendTelegram(text:string) {
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat)throw new Error('Telegram configuration missing');
  const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:chat,text}),signal:AbortSignal.timeout(5000),
  });
  const body=await response.json() as {ok?:boolean;parameters?:{retry_after?:number}};
  if(!response.ok||!body.ok)throw new RetryableDeliveryError(Math.max(1000,(body.parameters?.retry_after??1)*1000));
}
@Injectable()
export class TelegramService implements OnModuleInit,OnModuleDestroy {
  readonly enabled=process.env.NOTIFICATIONS_ENABLED==='true';
  readonly queue=new NotificationQueue(sendTelegram,Number(process.env.NOTIFICATION_COOLDOWN_MS||60000));
  private timer?:NodeJS.Timeout;
  onModuleInit(){
    if(this.enabled && (!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID))throw new Error('Enabled Telegram requires token and chat ID');
    if(this.enabled)this.timer=setInterval(()=>void this.queue.tick(),500);
  }
  enqueue(alert:Alert){if(this.enabled)this.queue.enqueue(alert);}
  onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
}
