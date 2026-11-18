#!/usr/bin/env python3
from pathlib import Path
import subprocess,tempfile
root=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory() as directory:
 header=Path(directory)/'profile.h'
 source=f'#define GAS_CONFIG_HEADER {header}\n#include "{root}/firmware/src/gas_input_simulation/Config.h"\n'
 for simulated,confirmed,expected in [(True,False,0),(False,False,1),(False,True,0)]:
  header.write_text('namespace Config { constexpr bool SIMULATED_INPUT='+str(simulated).lower()+'; constexpr bool CALIBRATION_CONFIRMED='+str(confirmed).lower()+'; }\n')
  result=subprocess.run(['clang++','-std=c++17','-x','c++','-fsyntax-only','-'],input=source,text=True,capture_output=True)
  assert (result.returncode!=0)==bool(expected),result.stderr
 print('Simulation allowed; unconfirmed physical profile rejected; explicitly confirmed profile accepted. No real calibration is implied.')
