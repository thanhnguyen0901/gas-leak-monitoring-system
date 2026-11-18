# Implementation plan

This document defines HOW and WHEN the system will be implemented. Requirements define scope; the audit records actual activity. Work proceeds one requested phase at a time, with simulation before physical integration.

Phase 0 is COMPLETED. The user authorized implementing subsequent phases sequentially and committing each phase on 2026-11-18, with user acceptance testing deferred to the final handoff. This supersedes the earlier instruction to wait after Phase 1. Each phase below retains its actual verification status; IN PROGRESS can mean implementation delivered but simulation, external-service, or physical verification remains pending. Checkboxes describe completed work only.

## Phase 0 - Project Initialization

**Status:** COMPLETED

**Objective:** Establish the development baseline and repository documentation.

**Tasks:**

- [x] Arduino IDE installed on macOS
- [x] ESP32 board package installed
- [x] ESP32 test sketch compiled successfully
- [x] Wokwi ESP32 simulation created
- [x] External LED blink test completed
- [x] Wokwi circuit successfully configured using `diagram.json`
- [x] GitHub repository created
- [x] Repository project structure initialized
- [x] Core documentation created

**Exit Criteria:** Requested structure and documentation exist and initialization checks are reviewed.

## Phase 1 - Gas Input Simulation

**Status:** IN PROGRESS

**Objective:** Read a controllable simulated analog gas input in Wokwi.

**Tasks:**

- [x] Define simulated analog input and its ADC range; label values as simulated/raw ADC.
- [x] Implement ADC reading and Serial output.
- [ ] Sweep and test the input range in Wokwi: record low, approximately middle, and high readings and confirm live Serial response. Manual simulator verification remains required.

**Exit Criteria:** Compilation and Wokwi evidence demonstrate ADC and Serial values across the documented simulated range.

## Phase 2 - Gas State Engine

**Status:** IN PROGRESS

**Objective:** Classify gas input into SAFE, WARNING, and DANGER.

**Tasks:**

- [x] Define simulated thresholds and boundary rules.
- [x] Implement SAFE / WARNING / DANGER classification and state transition logic.
- [x] Consider hysteresis and document the chosen behavior.
- [x] Test boundaries, rising/falling values, and recovery.

**Exit Criteria:** State transition tests and simulation verify all states and documented boundary/hysteresis behavior.

## Phase 3 - Local Warning System

**Status:** IN PROGRESS

**Objective:** Provide state-driven local visual and audible warnings.

**Tasks:**

- [x] Implement green, yellow, and red LED indications.
- [x] Define and implement buzzer patterns.
- [ ] Verify outputs for every state and transition.

**Exit Criteria:** Compilation and simulation verify LED mapping and buzzer patterns without networking.

## Phase 4 - OLED Display

**Status:** IN PROGRESS

**Objective:** Show gas level and system status locally.

**Tasks:**

- [x] Integrate SSD1306 OLED in simulation.
- [x] Display gas level with units/raw label and current state.
- [ ] Verify display updates during state changes.

**Exit Criteria:** Simulation shows readable, correct OLED data across states.

## Phase 5 - Relay and Fan Control

**Status:** IN PROGRESS

**Objective:** Respond automatically to unsafe gas states.

**Tasks:**

- [x] Define relay polarity and local fan activation/recovery rules.
- [x] Simulate relay and fan control from the state engine.
- [ ] Verify control across all states.

**Exit Criteria:** Simulation verifies relay/fan behavior according to documented rules without networking.

## Phase 6 - Wi-Fi Connectivity

**Status:** IN PROGRESS

**Objective:** Add Wi-Fi while preserving local safety operation.

**Tasks:**

- [x] Add external Wi-Fi configuration without committed credentials.
- [x] Implement connection and nonblocking reconnect logic.
- [ ] Test startup offline, disconnect, and restoration.

**Exit Criteria:** Local safety continues during outages and Wi-Fi reconnects when restored.

## Phase 7 - MQTT

**Status:** IN PROGRESS

**Objective:** Publish device telemetry and alerts.

**Tasks:**

- [x] Refine telemetry, alert, and status topics.
- [x] Define JSON payloads, units, and publish rules.
- [x] Configure broker details externally, initially targeting HiveMQ Cloud.
- [x] Implement publish and reconnect behavior without blocking local safety.
- [ ] Test broker outage and recovery.

**Exit Criteria:** Documented MQTT messages are observed and reconnect behavior is verified while local safety remains active.

## Phase 8 - Backend

**Status:** COMPLETED

**Objective:** Ingest device messages and expose monitoring interfaces in NestJS.

**Tasks:**

- [x] Create the NestJS application when requested.
- [x] Implement MQTT subscriber and telemetry processing.
- [x] Implement alert processing.
- [x] Implement REST and WebSocket interfaces.
- [x] Test valid/invalid payloads and interface behavior.

**Exit Criteria:** Backend tests verify ingestion, processing, REST, and WebSocket behavior using the agreed contracts.

## Phase 9 - PostgreSQL

**Status:** COMPLETED

**Objective:** Persist devices, readings, and alert history.

**Tasks:**

- [x] Define devices, gas readings, and alerts schema.
- [x] Implement migrations and backend persistence.
- [x] Test storage and historical retrieval.

**Exit Criteria:** Database integration tests verify migrations and device/reading/alert persistence and retrieval.

## Phase 10 - Web Dashboard

**Status:** COMPLETED

**Objective:** Provide realtime and historical visibility.

**Tasks:**

- [x] Create React/TypeScript/Vite application when requested.
- [x] Display gas level, status, fan state, and online/offline state.
- [x] Add realtime WebSocket updates.
- [x] Add a history chart and alert history.
- [x] Test stale data, reconnect, and display behavior.

**Exit Criteria:** Dashboard checks verify all required views and updates against backend data.

## Phase 11 - Telegram Notifications

**Status:** IN PROGRESS

**Objective:** Send useful remote alerts without spam.

**Tasks:**

- [x] Configure Telegram Bot API externally.
- [x] Send warning, danger, and recovery notifications.
- [x] Define and implement anti-spam handling and cooldown.
- [x] Test duplicate events, cooldown boundaries, and delivery failures.

**Exit Criteria:** Notification tests verify warning/danger/recovery and cooldown behavior without affecting local safety.

## Phase 12 - Full Simulation Integration

**Status:** IN PROGRESS

**Objective:** Validate the entire planned simulated data path.

**Tasks:**

- [ ] Test sensor simulation → ESP32 → MQTT → Backend → Database → Web → Telegram.
- [ ] Exercise SAFE / WARNING / DANGER and recovery end to end.
- [ ] Capture correlated evidence across components.

**Exit Criteria:** Recorded simulation evidence demonstrates the complete path and correct state/notification behavior.

## Phase 13 - Physical Hardware Integration

**Status:** NOT STARTED

**Objective:** Deploy to real ESP32 hardware after simulation validation.

**Tasks:**

- [ ] Confirm component voltages, power, ADC limits, and wiring.
- [ ] Integrate ESP32 DevKit V1, MQ-2 or MQ-5, SSD1306, buzzer, LEDs, relay, and DC fan.
- [ ] Deploy firmware and verify component operation; retain raw ADC labels until calibrated.

**Exit Criteria:** Physical wiring review and component checks are recorded, and firmware runs on the real ESP32.

## Phase 14 - Sensor Calibration

**Status:** NOT STARTED

**Objective:** Establish defensible real hardware thresholds.

**Tasks:**

- [ ] Document sensor datasheet, warm-up, calibration method, and conditions.
- [ ] Calibrate real hardware thresholds.
- [ ] Use ppm only with proper calibration and datasheet-based conversion.
- [ ] Record measurements, assumptions, and limitations.

**Exit Criteria:** Calibration evidence supports hardware thresholds and any reported concentration units.

## Phase 15 - Failure and Recovery Testing

**Status:** NOT STARTED

**Objective:** Verify resilience and local safety independence.

**Tasks:**

- [ ] Test Wi-Fi unavailable.
- [ ] Test MQTT unavailable.
- [ ] Test backend unavailable and downstream service outages.
- [ ] Test reconnect and recovery after each outage.
- [ ] Verify local sensing, classification, buzzer, LEDs, and fan control throughout.

**Exit Criteria:** Failure/recovery evidence confirms local safety independence and documented remote recovery behavior.

## Phase 16 - Final End-to-End Testing

**Status:** NOT STARTED

**Objective:** Validate the integrated calibrated hardware system.

**Tasks:**

- [ ] Run hardware input → ESP32 → MQTT → backend → database → web → Telegram checks.
- [ ] Verify state transitions, fan response, history, and recovery.
- [ ] Review requirements coverage and record defects/limitations.

**Exit Criteria:** All required end-to-end checks have recorded results and unresolved limitations are explicitly reviewed.

## Phase 17 - Final Report

**Status:** NOT STARTED

**Objective:** Document design, implementation, verification, and limitations.

**Tasks:**

- [ ] Prepare the final university report.
- [ ] Include architecture, circuit diagrams, calibration, and test evidence.
- [ ] Describe results, limitations, and future work with traceable references.

**Exit Criteria:** Final report is reviewed and its claims are supported by recorded evidence.
