#!/usr/bin/env python3
"""Run DB tests in an isolated throwaway container; never touches the project database."""
import os, secrets, subprocess, time, argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--suite',choices=['db','system','failure'],default='db')
args=parser.parse_args()
name='gas-monitor-test-'+secrets.token_hex(4)
password=secrets.token_urlsafe(24)
env={**os.environ,'POSTGRES_PASSWORD':password}
try:
 subprocess.run(['docker','run','--detach','--rm','--name',name,'-p','127.0.0.1::5432','--env','POSTGRES_PASSWORD','postgres:16-alpine'],env=env,check=True,stdout=subprocess.DEVNULL)
 for _ in range(60):
  if subprocess.run(['docker','exec',name,'pg_isready','-U','postgres'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0: break
  time.sleep(.5)
 else: raise RuntimeError('PostgreSQL did not become ready')
 port=subprocess.check_output(['docker','port',name,'5432/tcp'],text=True).strip().rsplit(':',1)[1]
 env.update(DATABASE_URL=f'postgres://postgres:{password}@127.0.0.1:{port}/postgres',GAS_TEST_DB_CONTAINER=name)
 subprocess.run(['npm','run','test:'+args.suite],cwd=root/'backend',env=env,check=True)
finally:
 subprocess.run(['docker','unpause',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 subprocess.run(['docker','rm','--force',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
