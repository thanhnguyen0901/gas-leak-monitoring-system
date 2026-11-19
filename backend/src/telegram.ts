import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Alert } from './contracts';
import { StorageService } from './storage';
import { NotificationPolicy, emptyPolicy, shouldNotify, deliveredPolicy, notificationText, retryDelay, RetryableDeliveryError } from './notification-policy';
export { RetryableDeliveryError } from './notification-policy';
export class NotificationQueue {
  private pending: {alert:Alert;attempts:number;next:number}[]=[];
  private queuedIds=new Set<string>();
  private policies=new Map<string,NotificationPolicy>();
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
    const a=item.alert,policy=this.policies.get(a.deviceId)??emptyPolicy();
    const shouldSend=shouldNotify(a,policy,now,this.cooldown);
    if(!shouldSend){this.remove();return;}
    this.busy=true;
    try {
      await this.send(notificationText(a));
      this.policies.set(a.deviceId,deliveredPolicy(a,policy,now));
      if(this.policies.size>1000)this.policies.delete(this.policies.keys().next().value!);
      this.delivered++;this.remove();
    } catch(error) {
      item.attempts++;
      if(item.attempts>=5){this.dropped++;this.remove();}
      else item.next=now+retryDelay(error,item.attempts);
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
  transport:(text:string)=>Promise<void>=sendTelegram;
  private readonly cooldown=Number(process.env.NOTIFICATION_COOLDOWN_MS||60000);
  readonly queue=new NotificationQueue(text=>this.transport(text),this.cooldown);
  private timer?:NodeJS.Timeout;
  private running?:Promise<void>;
  errors=0;
  constructor(private readonly storage:StorageService){}
  async onModuleInit(){
    if(this.enabled && (!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID))throw new Error('Enabled Telegram requires token and chat ID');
    await this.storage.ready();
    if(this.enabled)this.timer=setInterval(()=>void this.tick(),500);
  }
  async tick(){
    if(this.running)return this.running;
    this.running=(this.storage.pool ? this.storage.processNotification(text=>this.transport(text),this.cooldown).then(()=>{}) : this.queue.tick())
      .catch(()=>{this.errors++;}).finally(()=>{this.running=undefined;});
    return this.running;
  }
  enqueue(alert:Alert){if(this.enabled&&!this.storage.pool)this.queue.enqueue(alert);}
  async stats(){
    const durable=this.storage.pool ? await this.storage.notificationStats() : null;
    return {enabled:this.enabled,durable:Boolean(this.storage.pool),queued:durable?.pending??this.queue.size,
      delivered:durable?.sent??this.queue.delivered,failed:durable?.failed??this.queue.dropped,suppressed:durable?.suppressed??0,errors:this.errors};
  }
  async onModuleDestroy(){if(this.timer)clearInterval(this.timer);await this.running;}
}
