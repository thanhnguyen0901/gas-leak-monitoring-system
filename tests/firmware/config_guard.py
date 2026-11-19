#!/usr/bin/env python3
from pathlib import Path
import subprocess,tempfile
root=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory() as directory:
 header=Path(directory)/'profile.h'
 source=f'#define GAS_CONFIG_HEADER {header}\n#include "{root}/firmware/src/gas_input_simulation/Config.h"\n'
 for simulated,confirmed,warmup,expected in [(True,False,0,0),(False,False,1000,1),(False,True,0,1),(False,True,1000,0)]:
  header.write_text('namespace Config { constexpr bool SIMULATED_INPUT='+str(simulated).lower()+'; constexpr bool CALIBRATION_CONFIRMED='+str(confirmed).lower()+'; constexpr int WARNING_ADC=1400,DANGER_ADC=2800,HYSTERESIS_ADC=150; constexpr unsigned SENSOR_WARMUP_MS='+str(warmup)+'; constexpr bool SENSOR_DIAGNOSTICS_ENABLED=false; constexpr int SENSOR_LOW_RAIL=0,SENSOR_HIGH_RAIL=4095; constexpr unsigned SENSOR_RAIL_FAULT_MS=5000; constexpr unsigned short SENSOR_RECOVERY_SAMPLES=3; }\n')
  result=subprocess.run(['clang++','-std=c++17','-x','c++','-fsyntax-only','-'],input=source,text=True,capture_output=True)
  assert (result.returncode!=0)==bool(expected),result.stderr
 print('Simulation allowed; unconfirmed physical/warm-up profile rejected; explicitly confirmed profile accepted. No real calibration is implied.')
