import { StrictMode, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import { type Reading, type Alert, type Device, mergeReadings, mergeAlerts, effectiveOnline, sensorAttention, sensorLabels, type ServiceHealth, serviceWarnings } from './data';
import './style.css';
const base=(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/,'');
const token=import.meta.env.VITE_APP_TOKEN || '';
async function api<T,>(path:string):Promise<T> {
  const response=await fetch(base+'/api'+path,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(5000)});
  if(!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
const HistoryChart=lazy(()=>import('./HistoryChart'));
const labels={SAFE:'An toàn',WARNING:'Cảnh báo',DANGER:'Nguy hiểm'};
function App() {
  const [devices,setDevices]=useState<Device[]>([]),[selected,setSelected]=useState('');
  const [readings,setReadings]=useState<Reading[]>([]),[alerts,setAlerts]=useState<Alert[]>([]);
  const [connected,setConnected]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [health,setHealth]=useState<ServiceHealth|null>(null),[healthError,setHealthError]=useState(false);
  const selectedRef=useRef(selected); selectedRef.current=selected;
  const refreshRef=useRef<()=>Promise<void>>(async()=>{});
  refreshRef.current=async()=>{
    const id=selectedRef.current;
    const list=await api<Device[]>('/devices'); setDevices(list);
    if(id) {
      const [history,events]=await Promise.all([api<Reading[]>(`/devices/${encodeURIComponent(id)}/readings?limit=300`),api<Alert[]>(`/alerts?deviceId=${encodeURIComponent(id)}&limit=100`)]);
      if(id===selectedRef.current) {setReadings(old=>mergeReadings(old,history));setAlerts(old=>mergeAlerts(old,events));}
    }
    setError('');
  };
  useEffect(()=>{
    const socket=io(base,{auth:{token},transports:['websocket','polling']});
    socket.on('connect',()=>{setConnected(true);void refreshRef.current().catch(()=>setError('Không tải được dữ liệu từ máy chủ.'));});
    socket.on('disconnect',()=>setConnected(false));
    socket.on('connect_error',()=>{setConnected(false);setError('Chưa kết nối được máy chủ. Kiểm tra backend và cấu hình truy cập.');});
    socket.on('devices',(list:Device[])=>setDevices(list));
    socket.on('reading',(reading:Reading)=>{if(reading.deviceId===selectedRef.current)setReadings(old=>mergeReadings(old,[reading]));});
    socket.on('alert',(alert:Alert)=>{if(alert.deviceId===selectedRef.current)setAlerts(old=>mergeAlerts(old,[alert]));});
    void refreshRef.current().catch(()=>setError('Không tải được danh sách thiết bị.')).finally(()=>setLoading(false));
    return ()=>{socket.disconnect();};
  },[]);
  useEffect(()=>{
    let active=true,busy=false;
    const poll=async()=>{
      if(busy)return;busy=true;
      try{const value=await api<ServiceHealth>('/health');if(active){setHealth(value);setHealthError(false);}}
      catch{if(active)setHealthError(true);}finally{busy=false;}
    };
    void poll();const timer=setInterval(()=>void poll(),5000);
    return()=>{active=false;clearInterval(timer);};
  },[]);
  useEffect(()=>{if(!selected&&devices.length)setSelected(devices[0].id);},[devices,selected]);
  useEffect(()=>{
    setReadings([]);setAlerts([]);
    if(!selected)return;
    let cancelled=false;setLoading(true);
    Promise.all([api<Reading[]>(`/devices/${encodeURIComponent(selected)}/readings?limit=300`),api<Alert[]>(`/alerts?deviceId=${encodeURIComponent(selected)}&limit=100`)])
      .then(([r,a])=>{if(!cancelled){setReadings(old=>mergeReadings(old,r));setAlerts(old=>mergeAlerts(old,a));setError('');}})
      .catch(()=>{if(!cancelled)setError('Không tải được lịch sử thiết bị.');}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[selected]);
  const device=devices.find(d=>d.id===selected), latest=device?.latest;
  const online=effectiveOnline(device,connected), state=latest?.state;
  const healthCurrent=connected&&!healthError;
  const warnings=serviceWarnings(health,healthCurrent);
  return <div className="shell">
    <aside><a className="brand" href="/" aria-label="Gas Monitor trang chủ"><span className="brand-mark">G</span><span>GAS<br/><strong>MONITOR</strong></span></a><div className="nav-label">WORKSPACE</div><div className="nav-active">◉ <span>Trạm giám sát</span></div><div className="side-note"><span className="tiny-light"/> ESP32 / IoT<br/><p>Giám sát từ xa.<br/>Phản ứng tại thiết bị.</p></div></aside>
    <main><header><div><p className="eyebrow">HỆ THỐNG GIÁM SÁT KHÍ GAS</p><h1>Trạm giám sát<span>.</span></h1><p className="subtitle">Theo dõi tín hiệu, cảnh báo và trạng thái thông gió.</p></div><div className={'connection '+(connected?'live':'')}><i/>{connected?'Realtime đã kết nối':'Mất kết nối máy chủ'}</div></header>
    {error&&<div className="error" role="alert">{error} <button onClick={()=>void refreshRef.current().catch(()=>setError('Kết nối vẫn chưa sẵn sàng.'))}>Thử lại</button></div>}
    <section className="toolbar"><div><span className="section-number">01</span><strong>Tổng quan thiết bị</strong></div><label>Thiết bị <select aria-label="Chọn thiết bị" value={selected} onChange={e=>setSelected(e.target.value)}><option value="" disabled>{devices.length?'Chọn thiết bị':'Chưa có thiết bị'}</option>{devices.map(d=><option key={d.id}>{d.id}</option>)}</select></label></section>
    <section className="service-health" aria-label="Sức khoẻ hệ thống">
      <div><span>Lưu trữ</span><strong>{!healthCurrent||!health?'Chưa xác nhận':!health.storageAvailable?'Đang gián đoạn':health.storage==='postgresql'?'PostgreSQL sẵn sàng':'Bộ nhớ tạm'}</strong></div>
      <div><span>Kênh IoT</span><strong>{!healthCurrent||!health?'Chưa xác nhận':health.mqttConnected?'Broker đã kết nối':'Chưa kết nối'}</strong></div>
      <div><span>Telegram</span><strong>{!healthCurrent||!health?'Chưa xác nhận':!health.notifications.enabled?'Chưa bật':health.notifications.unavailable?'Chưa xác nhận':`${health.notifications.queued??0} chờ gửi · ${health.notifications.failed??0} lỗi`}</strong></div>
    </section>
    {warnings.length>0&&<div className="service-notice" role="status">{warnings.map(w=><p key={w}>{w}</p>)}</div>}
    {!devices.length?<section className="empty"><span>◎</span><h2>{loading?'Đang tải thiết bị…':'Đang chờ tín hiệu đầu tiên'}</h2><p>Khi ESP32 gửi telemetry, thiết bị và dữ liệu sẽ xuất hiện tại đây.</p><p>Chưa có dữ liệu đo để hiển thị.</p></section>:<>
    {sensorAttention(latest)&&<div className="sensor-warning" role="status"><strong>{online?'Cần kiểm tra cảm biến':'Trạng thái cảm biến ghi nhận cuối'}: {sensorLabels[latest!.sensorStatus!]}</strong><span>{online?'Cảnh báo và thông gió đang ở chế độ bảo thủ. Đây không phải xác nhận nồng độ gas.':'Thiết bị ngoại tuyến; trạng thái hiện tại chưa được xác nhận.'}</span></div>}
    {latest&&(latest.pendingAlerts!==undefined||latest.droppedAlerts!==undefined||latest.alertJournalHealthy!==undefined)&&<div className="device-delivery" role="status"><span>{online?'Hàng đợi thiết bị':'Thống kê thiết bị ghi nhận cuối'}: {latest.pendingAlerts??'—'} chờ ACK</span><span>Sự kiện vượt dung lượng: {latest.droppedAlerts??'—'}</span><span>Lưu bền thiết bị: {latest.alertJournalHealthy===undefined?'Chưa xác nhận':latest.alertJournalHealthy?'Sẵn sàng':'Cần kiểm tra'}</span></div>}
    <div className="cards">
      <article className="metric primary"><span className="card-label">TÍN HIỆU GAS</span><div className="value">{latest?.rawAdc??'—'} <small>ADC</small></div><div className="meter"><div style={{width:`${(latest?.rawAdc??0)/4095*100}%`}}/></div><p>{latest?.simulated?'Tín hiệu mô phỏng':'Tín hiệu cảm biến thô'} · 0–4095</p></article>
      <article className={'metric state '+(online&&state?state:'offline')}><span className="card-label">TRẠNG THÁI</span><h2>{!online?'Ngoại tuyến':sensorAttention(latest)?'Kiểm tra cảm biến':state?labels[state]:'Chờ dữ liệu'}</h2><p>{state?`${online?'Hiện tại':'Ghi nhận cuối'}: ${state}`:'Chưa có bản ghi'}</p><span className="pill">{online?'● THIẾT BỊ ONLINE':'○ CHƯA CÓ TÍN HIỆU MỚI'}</span></article>
      <article className="metric"><span className="card-label">THÔNG GIÓ</span><h2>{latest?(latest.fanOn?'Đang bật':'Đang tắt'):'—'}</h2><p>{online?'Trạng thái relay do ESP32 báo cáo':'Trạng thái cuối được báo cáo'}</p><div className="fan-icon">✣</div></article>
    </div>
    <section className="panel chart-panel"><div className="panel-heading"><div><span className="section-number">02</span><h2>Diễn biến tín hiệu</h2></div><span>RAW ADC · {readings.length} bản ghi</span></div><div className="chart">{readings.length?<Suspense fallback={<p className="chart-empty">Đang tải biểu đồ…</p>}><HistoryChart readings={readings}/></Suspense>:<p className="chart-empty">{loading?'Đang tải lịch sử…':'Chưa có lịch sử đo.'}</p>}</div><p className="chart-note">Giá trị ADC thô chưa được quy đổi thành nồng độ ppm. Dữ liệu cũ có thể được hiển thị khi thiết bị ngoại tuyến.</p></section>
    <section className="panel"><div className="panel-heading"><div><span className="section-number">03</span><h2>Lịch sử cảnh báo</h2></div><span>{alerts.length} sự kiện gần nhất</span></div><div className="table-scroll"><table><thead><tr><th>THỜI GIAN NHẬN</th><th>THAY ĐỔI TRẠNG THÁI</th><th>RAW ADC</th><th>SỰ KIỆN</th></tr></thead><tbody>{alerts.map(a=><tr key={a.id}><td>{new Date(a.receivedAt).toLocaleString('vi-VN')}</td><td>{a.previousState} <span className="arrow">→</span> {a.state}{a.sensorStatus&&<small className="quality-detail">{a.previousSensorStatus??'OK'} → {a.sensorStatus}</small>}</td><td>{a.rawAdc}</td><td><span className={'event-tag '+a.state}>{sensorAttention(a)?sensorLabels[a.sensorStatus!]:a.recovery?'Phục hồi':labels[a.state]}</span></td></tr>)}</tbody></table>{!alerts.length&&<p className="no-alerts">Chưa ghi nhận cảnh báo cho thiết bị này.</p>}</div></section>
    </>}
    <footer><span>GAS MONITOR / ESP32 + IoT</span><span>Cảnh báo và thông gió được xử lý tại ESP32.</span></footer>
    </main></div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
