#!/usr/bin/env python3
"""Summarize measured raw ADC reference groups; never infer ppm or approve calibration."""
import argparse,csv,hashlib,json,math
from pathlib import Path
GROUPS=('baseline','warning_reference','danger_reference')
def analyze(path):
 groups={name:[] for name in GROUPS}
 with Path(path).open(newline='') as f:
  reader=csv.DictReader(f)
  if not {'condition','raw_adc','reference'}.issubset(reader.fieldnames or []):
   raise ValueError('CSV requires condition,raw_adc,reference columns')
  for row in reader:
   condition=row['condition']
   if condition not in groups or not row['reference'].strip():raise ValueError('Unknown condition or missing reference provenance')
   raw=int(row['raw_adc'])
   if not 0<=raw<=4095:raise ValueError('ADC must be an integer 0–4095')
   groups[condition].append(raw)
 for name,values in groups.items():
  if len(values)<30:raise ValueError(f'{name} needs at least 30 measured samples')
 baseline,warning,danger=[groups[n] for n in GROUPS]
 gaps=[min(warning)-max(baseline),min(danger)-max(warning)]
 if min(gaps)<4:raise ValueError('Reference ranges overlap or have insufficient separation; do not invent thresholds')
 low=math.ceil((max(baseline)+min(warning))/2)
 high=math.ceil((max(warning)+min(danger))/2)
 hysteresis=min(100,min(gaps)//4)
 if not 0<=hysteresis<low<high-hysteresis<=4095:raise ValueError('Candidate thresholds are not valid')
 return {'units':'raw_adc_counts','calibrationConfirmed':False,'ppmConversion':False,
  'sourceSha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),
  'groups':{n:{'count':len(v),'min':min(v),'max':max(v),'mean':sum(v)/len(v)} for n,v in groups.items()},
  'candidates':{'warningAdc':low,'dangerAdc':high,'hysteresisAdc':hysteresis},
  'review':'Candidates only. Verify sensor datasheet, reference conditions, electrical scaling, recovery and repeatability before enabling physical mode.'}
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('csv');args=parser.parse_args()
 try:print(json.dumps(analyze(args.csv),indent=2))
 except (ValueError,OSError) as error:parser.exit(1,f'Calibration input rejected: {error}\n')
