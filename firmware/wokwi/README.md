# Phase 1 Wokwi gas input simulation

The version-controlled `diagram.json` contains only an ESP32 DevKit V1 and a controllable potentiometer (`gasInput`). The canonical sketch is [`../src/gas_input_simulation/gas_input_simulation.ino`](../src/gas_input_simulation/gas_input_simulation.ino); edit it there to avoid diverging copies.

## Circuit and ADC values

| Potentiometer pin | ESP32 connection |
| --- | --- |
| VCC | 3V3 |
| GND | GND.1 |
| SIG | GPIO 34 (ADC1) |

The sketch explicitly sets 12-bit ADC resolution, giving a raw count range of 0–4095. The potentiometer's Wokwi `value` attribute uses its own 0–1023 position scale; these are different scales. The initial position is 0. Both represent simulated input, not calibrated gas concentration or ppm. No production thresholds or state classifications exist.

## Run in the Wokwi browser

1. Open the [ESP32 Arduino template](https://wokwi.com/projects/new/esp32).
2. Replace the browser project's `sketch.ino` content with the canonical sketch and replace `diagram.json` with this directory's file. No additional libraries are needed.
3. Start simulation and open Serial Monitor. The sketch uses 115200 baud and prints `Gas raw ADC: <value>` every 500 ms.
4. Click the potentiometer and turn its knob. Keyboard controls after selecting it: Home/End select the endpoints; Left/Right make fine changes; Page Up/Page Down make coarse changes.
5. Test low, approximately middle, and high positions. Record at least three consecutive actual readings per position, then move back toward low and confirm readings respond. Expect low near 0, middle in the middle region (not necessarily exactly 2048), and high near 4095. These are expectations, not observed results; ADC mapping or saturation can affect exact readings.
6. If selecting a precise initial position is easier, stop the simulator, set `attrs.value` to `0`, `512`, or `1023` for low/middle/high respectively, and restart each case. Also change the knob during a running simulation to verify live response. Restore the repository's initial value to `0` afterward.
7. Save the real Serial transcript and any useful screenshots under `docs/evidence/phase-01/`, including the Wokwi project URL and input positions. Only then reconcile the remaining Phase 1 checklist.

## Optional local Wokwi extension workflow

Compile using the command in [firmware README](../README.md), then open this `firmware/wokwi/` directory as the VS Code workspace. `wokwi.toml` references build outputs relative to this directory. With a configured Wokwi extension/license, run **Wokwi: Start Simulator**. This repository does not include a license or CLI token. The browser workflow compiles the copied canonical sketch without these local tools.

## Verification boundary

See [recorded verification and pending cases](../../docs/evidence/phase-01/README.md). Static JSON/wiring review is not a simulator execution result. Low/middle/high Serial behavior must be observed before declaring Phase 1 complete.

## References

- [Wokwi potentiometer pins, position scale, and keyboard controls](https://docs.wokwi.com/parts/wokwi-potentiometer)
- [Wokwi diagram format](https://docs.wokwi.com/diagram-format)
- [Wokwi local project configuration](https://docs.wokwi.com/vscode/project-config)
- [Arduino-ESP32 raw ADC and resolution API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html)
