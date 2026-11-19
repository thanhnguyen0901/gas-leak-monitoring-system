export type SensorStatus='OK'|'WARMING_UP'|'LOW_RAIL'|'HIGH_RAIL'|'VERIFYING_SIGNAL';
export const sensorLabels:Record<SensorStatus,string>={OK:'Cảm biến sẵn sàng',WARMING_UP:'Cảm biến đang làm nóng',LOW_RAIL:'Tín hiệu ADC giữ ở mức thấp',HIGH_RAIL:'Tín hiệu ADC bão hoà cao',VERIFYING_SIGNAL:'Đang kiểm tra tín hiệu ADC'};
export type GasState = 'SAFE' | 'WARNING' | 'DANGER';
export type Reading = { version:1; deviceId:string; bootId:string; sequence:number; uptimeMs:number; rawAdc:number; state:GasState; previousState:GasState; fanOn:boolean; simulated:boolean; receivedAt:string; sensorStatus?:SensorStatus; previousSensorStatus?:SensorStatus; droppedAlerts?:number; pendingAlerts?:number; alertJournalHealthy?:boolean };
export type Alert = Reading & {id:string; recovery:boolean};
export type Device = {id:string; latest:Reading|null; online:boolean; lastSeen:string};
export function mergeReadings(previous: Reading[], incoming: Reading[], limit=300) {
  const map=new Map(previous.map(r=>[`${r.deviceId}:${r.bootId}:${r.sequence}`,r]));
  for (const r of incoming) map.set(`${r.deviceId}:${r.bootId}:${r.sequence}`,r);
  return [...map.values()].sort((a,b)=>Date.parse(a.receivedAt)-Date.parse(b.receivedAt)).slice(-limit);
}
export function mergeAlerts(previous:Alert[], incoming:Alert[]) {
  const map=new Map(previous.map(a=>[a.id,a]));
  for (const a of incoming) map.set(a.id,a);
  return [...map.values()].sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt)).slice(0,100);
}
export function effectiveOnline(device:Device|undefined, connected:boolean) { return connected && Boolean(device?.online); }

export function sensorAttention(reading:Reading|undefined|null){return Boolean(reading?.sensorStatus&&reading.sensorStatus!=='OK');}

export type ServiceHealth={status:'ok'|'degraded';storage:'postgresql'|'memory';storageAvailable:boolean;mqttConnected:boolean;ingestionQueued?:number;processingErrors?:number;invalidMessages:number;droppedMessages:number;notifications:{enabled?:boolean;durable?:boolean;queued?:number;failed?:number;delivered?:number;suppressed?:number;errors?:number;unavailable?:boolean}};
export function serviceWarnings(health:ServiceHealth|null,current:boolean){
 if(!health||!current)return ['Chưa xác nhận được tình trạng máy chủ.'];
 const warnings:string[]=[];
 if(!health.storageAvailable)warnings.push('Lưu trữ đang gián đoạn; kiểm tra kết nối cơ sở dữ liệu.');
 else if(health.storage==='memory')warnings.push('Đang dùng bộ nhớ tạm; lịch sử và thông báo không bền qua restart.');
 if(!health.mqttConnected)warnings.push('Kênh IoT chưa kết nối broker.');
 if(health.notifications.failed)warnings.push(`Có ${health.notifications.failed} thông báo chưa gửi thành công.`);
 if(health.processingErrors)warnings.push(`Máy chủ đã gặp ${health.processingErrors} lỗi xử lý/lưu dữ liệu.`);
 if(health.notifications.errors)warnings.push(`Worker thông báo đã gặp ${health.notifications.errors} lỗi xử lý.`);
 if(health.droppedMessages)warnings.push(`Máy chủ đã bỏ ${health.droppedMessages} bản tin do đầy hàng đợi.`);
 return warnings;
}
