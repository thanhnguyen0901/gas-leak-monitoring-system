# Phase 1 verification — 2026-11-01

Phase 0 is COMPLETED. Phase 1 is IN PROGRESS because Wokwi runtime observations have not been obtained. This directory contains real compilation output and static validation results only; no simulated Serial transcript or screenshots are claimed.

## Firmware build — verified

- Arduino CLI: 1.5.1, commit `01f3d4f2b`.
- Installed Arduino-ESP32 core: 3.3.12.
- Board FQBN: `esp32:esp32:esp32doit-devkit-v1`.
- Canonical sketch: `firmware/src/gas_input_simulation/gas_input_simulation.ino`.
- Command executed from repository root:

```sh
'/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli' compile \
  --fqbn esp32:esp32:esp32doit-devkit-v1 \
  --build-path /private/tmp/gas-leak-phase01-build \
  --output-dir firmware/wokwi/build firmware/src/gas_input_simulation
```

The command exited with code 0. Actual compiler summary is stored in [build.txt](build.txt): 279164 bytes of program storage and 22196 bytes of dynamic memory. Generated binaries and ELF files are ignored under `firmware/wokwi/build/`; they are not tracked evidence. The Wokwi config references the merged binary (bootloader, partition table, and application) and the ELF.

## Configuration — static checks only

[static-validation.txt](static-validation.txt) records JSON/TOML parsing, part IDs/types, wiring endpoints, source-to-diagram GPIO agreement, binary/ELF path existence, phase status consistency, unchanged later-phase plans, and preservation of historical audit entries. These checks do not constitute Wokwi execution or official `wokwi-cli lint` results.

GPIO 34 reads the simulated potentiometer. ADC resolution is 12 bits, raw range 0–4095, sample interval 500 ms, and Serial baud rate 115200. No thresholds or calibrated concentration conversion are implemented.

## Wokwi runtime — pending manual verification

The Wokwi CLI is not on PATH, no Wokwi VS Code extension was found in the inspected local extensions directory, and no CLI token is configured in the environment. Wokwi was not executed. Firmware compilation was local; it does not prove simulator startup or runtime ADC response.

| Case | Input to set | Expected behavior only | Actual observation |
| --- | --- | --- | --- |
| Low | Knob minimum; initial `value: "0"` | Raw reading near 0 | NOT RUN |
| Approximately middle | Knob around halfway; initial `value: "512"` | Raw reading in the middle region; exact value may vary | NOT RUN |
| High | Knob maximum; initial `value: "1023"` | Raw reading near 4095 | NOT RUN |
| Live change | Move knob low → middle → high → low while running | Labeled Serial values respond about every 500 ms | NOT RUN |

Follow [the browser run instructions](../../../firmware/wokwi/README.md), record at least three consecutive actual readings per position and live response, and append results to `audit.md`. The potentiometer position attribute uses 0–1023, distinct from ESP32's 0–4095 raw ADC range. Neither is a calibrated gas concentration.

## Scope review

The only firmware behavior is Serial initialization, input configuration, explicit ADC resolution, analog sampling, labeled printing, and a 500 ms delay. The diagram contains only ESP32 and potentiometer. No classification, production gas thresholds, LED control, buzzer, OLED, relay/fan, networking, MQTT, backend, or frontend functionality was added. Physical hardware and ppm calibration were not tested.

## Exact next step

Run the documented Wokwi circuit with the canonical sketch and record low/middle/high and live-change Serial results. If all Phase 1 exit criteria are verified, complete its remaining task and status in `plan.md` and append a dated audit entry. Keep Phase 2 NOT STARTED until explicitly requested. No commit or push is authorized for this task.
