import {test} from 'node:test';
import assert from 'node:assert/strict';
import {io} from 'socket.io-client';
import {createApp} from '../src/main';
test('configured read token protects REST and rejects unauthorized Socket.IO clients',async()=>{
 process.env.APP_TOKEN='synthetic-test-token';process.env.MQTT_URL='';process.env.DATABASE_URL='';process.env.NOTIFICATIONS_ENABLED='false';
 const app=await createApp();await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 const socket=io(base,{autoConnect:false,transports:['websocket'],auth:{token:'wrong'}});
 try {
  assert.equal((await fetch(base+'/api/devices')).status,401);
  assert.equal((await fetch(base+'/api/devices',{headers:{Authorization:'Bearer synthetic-test-token'}})).status,200);
  const disconnected=new Promise<void>((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Unauthorized socket not rejected')),2000);
   socket.once('disconnect',()=>{clearTimeout(timeout);resolve();});
  });socket.connect();await disconnected;
 }finally{socket.close();await app.close();delete process.env.APP_TOKEN;}
});
