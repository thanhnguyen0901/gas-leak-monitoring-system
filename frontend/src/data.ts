export type GasState = 'SAFE' | 'WARNING' | 'DANGER';
export type Reading = { version:1; deviceId:string; bootId:string; sequence:number; uptimeMs:number; rawAdc:number; state:GasState; previousState:GasState; fanOn:boolean; simulated:boolean; receivedAt:string };
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
