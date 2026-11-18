#!/usr/bin/env python3
"""Create local configuration without printing or overwriting credentials."""
from pathlib import Path
import os,secrets
root=Path(__file__).resolve().parents[1]
p=root/'infrastructure/.env'
if p.exists():
 print('infrastructure/.env already exists; preserved')
else:
 template=(root/'infrastructure/.env.example').read_text()
 fd=os.open(p,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
 with os.fdopen(fd,'w') as f:f.write(template.replace('POSTGRES_PASSWORD=','POSTGRES_PASSWORD='+secrets.token_urlsafe(32),1))
 print('Created ignored infrastructure/.env with a generated local password')
