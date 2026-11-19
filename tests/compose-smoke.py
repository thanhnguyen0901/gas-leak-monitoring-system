#!/usr/bin/env python3
"""Isolated Compose smoke test. Uses only public images, generated test credentials and random localhost ports."""
import json,os,secrets,socket,subprocess,tempfile,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
project='gas-qa-'+secrets.token_hex(4)
def port():
 with socket.socket() as server:
  server.bind(('127.0.0.1',0));return str(server.getsockname()[1])
with tempfile.TemporaryDirectory(prefix='gas-compose-') as directory:
 temp=Path(directory)
 # Avoid personal registry credential helpers for this public-image test.
 config=temp/'docker';config.mkdir()
 (config/'config.json').write_text(json.dumps({'auths':{},'cliPluginsExtraDirs':[str(Path.home()/'.docker/cli-plugins'),'/Applications/Docker.app/Contents/Resources/cli-plugins']}))
 env={**os.environ,'DOCKER_CONFIG':str(config),'DOCKER_HOST':os.environ.get('DOCKER_HOST') or ('unix://'+str(Path.home()/'.docker/run/docker.sock') if (Path.home()/'.docker/run/docker.sock').exists() else 'unix:///var/run/docker.sock')}
 settings={'POSTGRES_PASSWORD':secrets.token_urlsafe(32),'BACKEND_PORT':port(),'FRONTEND_PORT':port(),'POSTGRES_PORT':port(),'BROKER_PORT':port(),'MQTT_URL':'mqtt://broker:1883','MQTT_USER':'','MQTT_PASSWORD':'','APP_TOKEN':'','NOTIFICATIONS_ENABLED':'false','TELEGRAM_BOT_TOKEN':'','TELEGRAM_CHAT_ID':''}
 settings.update(PUBLIC_API_URL='http://localhost:'+settings['BACKEND_PORT'],WEB_ORIGIN='http://localhost:'+settings['FRONTEND_PORT'])
 env.update(settings)
 envfile=temp/'test.env';envfile.write_text('\n'.join(k+'='+v for k,v in settings.items())+'\n');envfile.chmod(0o600)
 compose=['docker','compose','--project-directory',str(root/'infrastructure'),'--env-file',str(envfile),'-p',project]
 def run(command,timeout=120,**kwargs):return subprocess.run(command,env=env,check=True,timeout=timeout,**kwargs)
 try:
  for image in ['node:22-alpine','node:22-bookworm-slim','nginxinc/nginx-unprivileged:alpine','eclipse-mosquitto:2']:
   print('Checking public image '+image,flush=True);run(['docker','pull',image],timeout=60)
  run(compose+['config','--quiet'])
  run(compose+['build'],timeout=180)
  run(compose+['up','-d','--wait','--wait-timeout','60'],timeout=90)
  base=settings['PUBLIC_API_URL'];health=None
  for _ in range(40):
   try:
    health=json.load(urllib.request.urlopen(base+'/api/health',timeout=3))
    if health['storageAvailable'] and health['mqttConnected']:break
   except (OSError,ValueError):pass
   time.sleep(.5)
  assert health and health['storage']=='postgresql' and health['mqttConnected'], 'Stack readiness failed'
  assert health['notifications']['durable'] is True
  payload={'version':1,'deviceId':'compose-test','bootId':'0123456789abcdef','sequence':1,'uptimeMs':500,'rawAdc':3000,'state':'DANGER','previousState':'SAFE','fanOn':True,'simulated':True}
  for topic in ['telemetry','alert']:
   run(compose+['exec','-T','broker','mosquitto_pub','-t','gas-monitor/device/compose-test/'+topic,'-m',json.dumps(payload),'-q','1'])
  for _ in range(40):
   history=json.load(urllib.request.urlopen(base+'/api/alerts?deviceId=compose-test',timeout=3))
   if history:break
   time.sleep(.1)
  assert len(history)==1 and history[0]['rawAdc']==3000
  html=urllib.request.urlopen(settings['WEB_ORIGIN'],timeout=5).read().decode()
  assert '<div id="root">' in html
  print('COMPOSE PASS: images build; PostgreSQL+broker+backend+dashboard start; synthetic MQTT event persists; frontend HTTP works. No real Telegram or hardware.',flush=True)
 except subprocess.TimeoutExpired:
  print('COMPOSE NOT VERIFIED: timed out retrieving public image/build/startup; no application PASS inferred.',flush=True)
  raise SystemExit(1)
 finally:
  subprocess.run(compose+['down','--volumes','--remove-orphans','--rmi','local'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30)
