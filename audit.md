# Project execution audit

> Do not rewrite historical entries. New project activity must be appended as a new dated entry.

## 2026-11-01 — Prior environment setup and Wokwi validation

The following work was reported as already completed in the project initialization request. It has not been rerun as part of repository initialization.

### Environment setup

- Arduino IDE installed on macOS.
- ESP32 board package installed.
- ESP32 Dev Module compilation verified.
- GitHub repository created.

Known successful compilation output supplied with the request:

```text
Sketch uses 269028 bytes (20%) of program storage space.
Maximum is 1310720 bytes.

Global variables use 22116 bytes (6%) of dynamic memory,
leaving 305564 bytes for local variables.
Maximum is 327680 bytes.
```

### Wokwi validation

- ESP32 DevKit simulation created.
- Initial attempt expected an onboard GPIO 2 LED.
- An external LED was added instead.
- Circuit was configured through `diagram.json`.
- LED blink simulation succeeded.

The prior sketch and circuit are not included in this documentation-only initialization.

### Decision

Use version-controlled `diagram.json` rather than relying primarily on manually drawn Wokwi wiring. It is reproducible, Git-trackable, inspectable and modifiable by AI agents, easier to review, and easier to reproduce in simulation. The intended repository path is `firmware/wokwi/diagram.json` when implementation begins.

### Current state

Phase 0 is in progress.

### Next step

Complete repository initialization, then begin Phase 1 - Gas Input Simulation.

## 2026-11-01 — Repository documentation initialization

### Work completed

Created the 20 requested documentation and placeholder files, including requirements, all 18 planned phases, agent instructions, target architecture, future testing strategy, directory READMEs, `.gitkeep` placeholders, and `.gitignore`.

Captured local safety independence, simulation-first development, configurable MQTT broker details, calibration/ppm limits, and secret-handling rules. No firmware, circuit JSON, application scaffolding, dependencies, database containers, or integrations were implemented.

### Verification

- Checked the exact file inventory: all 20 requested files exist, including 17 Markdown files, with no extra project files or dependency/build artifacts.
- Checked all 18 phase headings and status fields: only Phase 0 is IN PROGRESS; Phases 1–17 are NOT STARTED.
- Confirmed exactly seven supplied prior tasks are checked. The two initialization checkboxes remain unchecked to honor the request to preserve only explicitly supplied completed items; this entry records the newly performed work.
- Checked all seven Markdown link targets; all exist.
- Reviewed generated content and scanned for credential assignments, private keys, and Telegram token patterns; no secrets were found.
- Verified ignore rules cover environment files, dependency/build paths, macOS metadata, and IDE metadata. Confirmed example environment files, Markdown, Wokwi JSON, and source paths remain unignored.
- Compilation, runtime tests, and Wokwi execution were not applicable to this documentation-only change and were not run.

### Current state and next step

Phase 0 remains in progress as requested. Reconcile the initialization checkboxes during the next plan review using this entry as evidence. The exact next implementation step, when requested, is Phase 1 - Gas Input Simulation: define a controllable simulated analog input and ADC range in Wokwi, then implement ADC reading and Serial output and test the input range.

No commit or push was performed.

## 2026-11-01 — Phase 0 reconciliation and completion

Reviewed `AGENTS.md`, `requirements.md`, `plan.md`, and the historical audit entries before work. Reconciled the initialization checklist against the verified 20-file inventory and documentation checks recorded above, now present in initialization commit `b50b695`. Marked repository structure and core documentation complete and Phase 0 COMPLETED. Phase 1 is now IN PROGRESS; all later phases remain NOT STARTED. Historical audit entries were preserved.

The next requested task is Phase 1 only: simulated analog input, ADC reading, and labeled Serial output, followed by compilation and Wokwi verification.

## 2026-11-01 — Phase 1 gas input simulation implementation

### Files changed

- Created `firmware/src/gas_input_simulation/gas_input_simulation.ino`.
- Created `firmware/wokwi/diagram.json` and `firmware/wokwi/wokwi.toml`.
- Removed the now-unnecessary `firmware/src/.gitkeep` and `firmware/wokwi/.gitkeep`.
- Updated `firmware/README.md` and `firmware/wokwi/README.md` with build, ADC, wiring, and simulator instructions.
- Updated `README.md` and `docs/architecture.md` to reflect the limited current implementation.
- Updated `plan.md` for Phase 0 reconciliation, Phase 1 implementation tasks, and pending simulator verification.
- Appended this audit entry and the Phase 0 reconciliation entry; preserved all historical entries.
- Added `docs/evidence/phase-01/README.md`, `build.txt`, and `static-validation.txt`.

### Implementation

A Wokwi potentiometer simulates the gas signal: SIG → GPIO 34 (ADC1), VCC → 3V3, GND → GND.1. Firmware sets 12-bit ADC resolution (raw 0–4095), calls `analogRead`, and prints `Gas raw ADC: <value>` at 115200 baud every 500 ms. Wokwi potentiometer position uses a separate 0–1023 scale. These are simulated/raw values, not calibrated ppm. No later-phase functionality was added.

### Build result

Compiled successfully with Arduino CLI 1.5.1 and Arduino-ESP32 3.3.12 for `esp32:esp32:esp32doit-devkit-v1`; exit code 0. Sketch uses 279164 bytes (21%) of 1310720 bytes of flash. Global variables use 22196 bytes (6%) of 327680 bytes, leaving 305484 bytes. Actual output and reproduction command are recorded under `docs/evidence/phase-01/`. Build artifacts are ignored; Wokwi configuration references the generated merged binary and ELF.

### Wokwi verification, observations, and limitations

Static JSON/TOML and wiring checks are recorded in `docs/evidence/phase-01/static-validation.txt`. Simulator execution and official CLI lint were not performed: local Wokwi CLI/extension and environment CLI token are unavailable. Low, approximately middle, high, and live-change Serial checks are NOT RUN; no runtime readings or screenshots are invented. Compilation does not establish simulator behavior. Manual browser instructions and an explicit pending-case table are provided. No physical sensor or concentration calibration was tested.

### Current phase status and exact next step

Phase 0 is COMPLETED. Phase 1 remains IN PROGRESS: simulated input definition and sampling/Serial implementation are complete; the Wokwi input sweep and live response verification remain unchecked. Phase 2 and all later phases remain NOT STARTED.

Next: run the canonical sketch and version-controlled circuit in Wokwi, vary the knob through low/middle/high and back, and record at least three consecutive readings per position plus live response under `docs/evidence/phase-01/`. Append the real observations to this audit and complete Phase 1 only if its exit criteria are met. Do not start Phase 2. No commit or push was performed.

## 2026-11-18 — Phase 2

Added the portable SAFE/WARNING/DANGER engine with simulation-only raw thresholds, hysteresis and fail-to-danger invalid input handling. Added the explicit user-authorized sequencing decision.

Verification: Native C++ tests passed across all 4096 ADC values and boundary/recovery/invalid cases (`native.txt`). ESP32 compilation succeeded (`build.txt`). Wokwi transition observations remain deferred to final user testing.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-02/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 3

Added green/yellow/red LEDs on GPIO25/26/27 with 220-ohm series resistors and buzzer on GPIO32. Warning sounds 150ms/2s; danger 200ms/400ms at 2kHz. Replaced the sampling delay with millis scheduling.

Verification: ESP32 compilation and native LED/cadence tests passed. Wokwi visual/audio checks remain deferred.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-03/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 4

Added SSD1306 I2C display on SDA21/SCL22 at 0x3C showing raw ADC, gas state and simulation/calibration label. Added pinned Wokwi library list and a reusable firmware build script.

Verification: ESP32 compilation succeeded using Adafruit SSD1306 2.5.17, GFX 1.13.0 and BusIO 1.17.4. Display absence does not prevent sampling; Wire timeout is bounded. Visual display verification remains deferred.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-04/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.
