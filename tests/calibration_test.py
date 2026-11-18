import importlib.util,tempfile,unittest,csv
from pathlib import Path
spec=importlib.util.spec_from_file_location('calibrate',Path(__file__).resolve().parents[1]/'scripts/calibrate.py')
calibrate=importlib.util.module_from_spec(spec);spec.loader.exec_module(calibrate)
class CalibrationTests(unittest.TestCase):
 def data(self,values):
  d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);p=Path(d.name)/'synthetic.csv'
  with p.open('w',newline='') as f:
   w=csv.writer(f);w.writerow(['condition','raw_adc','reference'])
   for name,raw in zip(calibrate.GROUPS,values):
    for _ in range(30):w.writerow([name,raw,'synthetic unit-test fixture; not real calibration'])
  return p
 def test_candidates_never_claim_calibration_or_ppm(self):
  result=calibrate.analyze(self.data([100,1800,3400]))
  self.assertFalse(result['calibrationConfirmed']);self.assertFalse(result['ppmConversion'])
  self.assertEqual(result['candidates']['warningAdc'],950)
 def test_overlapping_and_invalid_input_rejected(self):
  for data in ([100,100,3400],[100,1800,5000]):
   with self.assertRaises(ValueError):calibrate.analyze(self.data(data))
if __name__=='__main__':unittest.main()
