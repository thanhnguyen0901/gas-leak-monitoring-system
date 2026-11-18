# Hardware calibration procedure — measurements pending

No hardware calibration or ppm conversion has been performed. Demonstration thresholds 1400/2800/150 are simulated raw counts only.

1. Identify the exact MQ-2/MQ-5 sensor/module and obtain its current manufacturer's datasheet. Record heater supply, preheat requirements, load resistor, divider/buffer, ADC attenuation, sensor serial/batch, temperature and humidity. Follow the actual datasheet rather than an assumed short warm-up.
2. Review wiring and voltage measurements from `hardware.md`. Allow heater/sensor stabilization under the specified conditions. Record baseline drift and saturation/fault behavior. An unplugged analog sensor is not reliably diagnosed by the current firmware.
3. Obtain supervised, controlled reference conditions with appropriate calibrated reference equipment and laboratory procedures. This repository provides no procedure for releasing combustible gas. Document reference identity and concentration provenance independently of raw ADC readings.
4. Capture at least 30 stable readings per baseline, warning reference and danger reference condition, with columns `condition,raw_adc,reference`. Accepted condition labels are `baseline`, `warning_reference`, `danger_reference`. Preserve the actual Serial log and reference records.
5. Run `python3 scripts/calibrate.py measured.csv > candidates.json`. It validates raw input, rejects overlapping reference ranges, and proposes raw-count midpoints with a bounded hysteresis for **review only**. Its output always leaves calibrationConfirmed false and ppmConversion false. Midpoint candidates are not automatic proof of calibration or a datasheet conversion.
6. Verify repeated rising/falling reference runs, environmental variation and appropriate safety margins. Review candidate thresholds against datasheet response and reference measurements. Record approved raw thresholds and limitations, then update ignored config.local.h and explicitly confirm physical calibration only after review.
7. Repeat the hardware and final acceptance tests. Keep values labeled raw ADC. Claim ppm only after a separate sensor-resistance/R0 calibration and a datasheet-based gas-specific conversion with independently verified accuracy; that conversion is not implemented here.

Store real measurements, chosen thresholds, setup and signed review under `docs/evidence/phase-14/` when available. Current unit tests use synthetic numeric fixtures only.

Reference: [Winsen MQ-2 manual](https://www.winsen-sensor.com/d/files/manual/mq-2.pdf). A different module/manufacturer may have different requirements.
