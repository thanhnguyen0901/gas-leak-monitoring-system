#!/usr/bin/env python3
"""Export a credential-free Wokwi source bundle; build artifacts stay ignored."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
source=root/'firmware/src/gas_input_simulation'
output=root/'firmware/wokwi/build/project'
if output.exists():shutil.rmtree(output)
output.mkdir(parents=True)
shutil.copy2(source/'gas_input_simulation.ino',output/'sketch.ino')
for path in source.glob('*.h'):
 if path.name!='config.local.h':shutil.copy2(path,output/path.name)
for name in ['diagram.json','libraries.txt']:shutil.copy2(root/'firmware/wokwi'/name,output/name)
print('Exported firmware/wokwi/build/project; local credentials excluded. Configure networking privately after import.')
