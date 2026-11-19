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

## 2026-11-18 — Phase 5

Added local relay control on GPIO33, active high in Wokwi. Fan runs for WARNING or DANGER and stops in SAFE after hysteresis recovery. The relay switches a blue LED representing a fan load, not a motor simulation.

Verification: ESP32 compilation and native fan/state-output tests passed. Relay switching and actual fan electrical/airflow behavior remain manual checks. Physical relay polarity must be verified.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-05/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 6

Added optional Wi-Fi configuration through ignored config.local.h, with empty-SSID offline defaults. Reconnection runs at 10-second intervals in a dedicated FreeRTOS task on core 0; local sensing/outputs remain on core 1.

Verification: ESP32 compilation succeeded. Task creation failure leaves local loop active. Real/simulated AP disconnect and restore checks are deferred to final testing; no connectivity PASS is claimed.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-06/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 7

Added configurable MQTT telemetry/alert/status topics, JSON v1 payload, retained Last Will, reconnect spacing, TLS CA validation with NTP and a bounded nonblocking snapshot/event queue. Added the transport contract.

Verification: ESP32 compilation succeeded with PubSubClient 2.8. Actual broker delivery, TLS credentials and outage behavior on ESP32 remain final manual checks. QoS 0 data and 16 RAM alerts have explicit loss limits.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-07/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 8

Implemented NestJS MQTT ingestion, strict v1 payload validation, bounded in-memory history, alert deduplication, stale-device status, REST endpoints and Socket.IO broadcasts. Added optional read token and explicit CORS/localhost defaults.

Verification: npm test passed: TypeScript build, invalid-payload tests and a real temporary MQTT broker → NestJS → REST/WebSocket test, including duplicate alerts and stale data. This verifies software transport, not ESP32/Wokwi or external HiveMQ.

Status: COMPLETED. Evidence: `docs/evidence/phase-08/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 9

Added transactional PostgreSQL persistence for devices, gas_readings and alerts, versioned/idempotent SQL migration, uniqueness/ADC/state constraints and historical REST queries. Added an isolated throwaway-container DB test runner. Empty DATABASE_URL remains explicitly ephemeral memory mode.

Verification: Real PostgreSQL 16 Docker tests passed: migrations, repeat application, duplicate suppression, invalid ADC rollback and persistence across storage reconnect. MQTT/API/WebSocket regression tests passed. Temporary test container removed.

Status: COMPLETED. Evidence: `docs/evidence/phase-09/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 10

Implemented a Vietnamese React/TypeScript/Vite dashboard with device selection, ADC/state/fan cards, online/offline handling, realtime history chart, alert/recovery history and reconnect history refresh. Includes responsive desktop/mobile layouts and empty/error states.

Verification: TypeScript/Vite build and frontend history/offline unit tests passed. Browser desktop and 390px mobile rendering inspected; screenshots and accessibility snapshot saved using explicitly synthetic software-preview data through the real local backend. Backend shutdown was observed as offline in browser-offline.txt. No ESP32 or physical results are implied. Vite reports a non-fatal large bundle warning; React StrictMode may cancel its first development WebSocket connection.

Status: COMPLETED. Evidence: `docs/evidence/phase-10/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 11

Added opt-in Telegram delivery, warning/danger/recovery messages, severity-aware cooldown, pending-event deduplication, bounded worker queue and retry/backoff handling including Telegram rate limits. Ingestion never waits for Telegram HTTP.

Verification: All 5 backend tests passed, including notification policy, recovery, duplicate/cooldown, retry_after and bounded retry/queue tests using mock delivery. No real Telegram message was sent. Live bot/chat acceptance remains manual. Queue and cooldown are RAM-only across backend restart.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-11/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 12

Added Dockerfiles, localhost-only development Compose services, generated local configuration helper, broker configuration and a repeatable isolated software-path integration test.

Verification: Synthetic MQTT → NestJS → real PostgreSQL → REST/WebSocket → mock Telegram integration passed through SAFE/WARNING/DANGER/recovery. Compose syntax validated. Docker image build was interrupted while waiting for base-image metadata and is NOT VERIFIED. Full Wokwi and live Telegram integration remain deferred to final acceptance.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-12/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 13

Prepared physical GPIO mapping, configurable raw thresholds/relay polarity and a simulation-vs-hardware mode guard that refuses unconfirmed physical calibration. Payload/display labels reflect the selected profile. Added external config-header support without versioning credentials.

Verification: Default ESP32 build passed. A temporary network-enabled simulation profile (Wokwi-GUEST, example.invalid broker, no real credentials) also linked successfully: 1056321 bytes flash, 49644 bytes globals. Host compile tests verify physical mode is rejected unless explicitly confirmed. No hardware was flashed, wired or measured; all physical tasks remain unchecked.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-13/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 14

Added raw ADC reference-data analysis utility, overlap/range/provenance validation, candidate thresholds for review only, hardware calibration procedure and compile-time threshold validation. No ppm conversion or automatic calibration approval is implemented.

Verification: Two Python tests using explicitly synthetic fixtures passed, hardware-mode guard tests passed and ESP32 compilation succeeded. Real reference measurements, approved hardware thresholds and calibration evidence do not exist yet; those phase tasks remain unchecked.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-14/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 15

Added real backend outage/reconnect tests, stale/retired-boot protection, database-aware health and runtime configuration validation. Moved OLED I2C work to its own bounded-queue task so the core safety loop does not draw frames. Added an explicit failure matrix.

Verification: Actual temporary MQTT shutdown/restart and PostgreSQL pause/unpause tests passed; all 6 backend regression tests passed; firmware compiled. Actual ESP32/Wokwi Wi-Fi outages, local output continuity and physical sensor/reset faults remain pending, so phase exit is not claimed.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-15/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 16

Added a consolidated verification command, credential-free Wokwi source exporter, authenticated REST/WebSocket tests, deterministic equal-time history ordering and a single final manual acceptance checklist. Updated firmware/simulation instructions for the integrated code.

Verification: Complete automated suite passed: portable firmware outputs/state, hardware guard, Python calibration tests, 7 backend tests, 2 frontend tests/build, real PostgreSQL migration, full software-path integration and broker/DB outage tests. Diagram/export static checks passed. Physical end-to-end and actual Wokwi/live Telegram remain unexecuted; Phase 16 is not complete.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-16/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-18 — Phase 17

Prepared the implementation report draft and FR-01–FR-16 coverage matrix, refreshed repository/architecture/testing/run documentation, and consolidated all remaining user acceptance work. Hardened the basic backend test to ignore exported live storage/notification configuration. Reconciled Phase 16 requirements-review task as completed using the new coverage matrix.

Verification: Final backend regression passed (7 tests). Documentation links, audit-prefix preservation, phase statuses, ignored secret/build paths and credential-pattern checks were reviewed. Actual measured Wokwi/hardware/Telegram/calibration results and final report review are still pending; the report is explicitly a draft.

Status: IN PROGRESS. Evidence: `docs/evidence/phase-17/`. User authorized sequential implementation and a separate commit per phase, with final manual acceptance deferred. No push.

## 2026-11-19 — Reliability hardening plan

Read AGENTS.md, requirements.md, plan.md and audit.md before work. User requested a concrete improvement plan and immediate implementation before one final manual test round. Code review identified RAM-only notification state/outbox, alert removal without backend acknowledgement, incomplete sensor-quality handling, and limited operational visibility. Added the bounded H1–H4 hardening plan to plan.md. Original acceptance results remain unchanged; no hardware calibration, Wokwi execution or live Telegram result is inferred.

## 2026-11-19 — H1 durable notifications

Added migration 002 for a transactional PostgreSQL notification outbox and persistent per-device cooldown/unsafe state. Added checksum-verified migration discovery, shared database TLS configuration for runtime/migration, and shutdown ordering that drains notification work before closing the pool. Alert and outbox insertion are one transaction; worker row locks preserve device ordering and prevent concurrent claims. New DANGER incidents bypass previous-incident cooldown. Failed jobs remain observable. Memory mode remains non-durable; external Telegram send followed by pre-commit crash can cause a duplicate (no exactly-once claim).

Verification: TypeScript build, 8 backend tests and 3 real PostgreSQL software/restart integration tests passed using mocked delivery, including pending jobs/cooldown/recovery across worker recreation and concurrent job claims. No real Telegram call or hardware test was performed. Evidence: docs/evidence/hardening-2026-11-19/.

## 2026-11-19 — H2 durable transition retries and application ACK

Added a bounded, checksummed 32-event NVS journal plus 16-event nonblocking RAM ingress. Flash operations stay in the core-0 worker; local outputs do not wait. Retries retain the head until matching backend ACK and persisted local removal. Backend ACK follows PostgreSQL commit, including idempotent duplicate retries, and is disabled for memory-only mode. Added explicit drop/depth/journal-health payload fields and identity/corruption guards. Documented ingress power-loss window, capacity, flash endurance and memory fallback limits; no unlimited or exactly-once transport claim.

Verification: portable journal tests passed for restore/order/capacity/corruption/ACK removal, ESP32 build passed (651621 flash bytes, 34048 globals), backend regressions and PostgreSQL/MQTT ACK integration passed. Actual DB pause test confirmed no ACK on failed persistence and one stored alert after retry/recovery. Real ESP32 power-cycle/NVS behavior and Wokwi execution remain manual. Evidence: docs/evidence/hardening-2026-11-19/.
