# System requirements

This document is the source of truth for WHAT the system must do. All requirements below describe the target system; they are not claims of implementation.

## Project scope

Build an ESP32-based university prototype for continuous gas monitoring, local warning and automatic ventilation, with IoT telemetry, persisted history, a realtime dashboard, and remote notifications. Validate the system in Wokwi before deploying firmware to physical hardware. Implement incrementally according to `plan.md`.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | Continuously sample gas input and expose the measured level with its unit or raw/simulated label. |
| FR-02 | Classify gas levels as SAFE, WARNING, or DANGER using documented thresholds and transition rules. |
| FR-03 | Indicate SAFE with green, WARNING with yellow, and DANGER with red LEDs. |
| FR-04 | Provide audible warning through a buzzer for warning and danger conditions; define patterns during local warning implementation. |
| FR-05 | Display gas level and current system status on an OLED. |
| FR-06 | Automatically control a ventilation fan through a relay according to documented local gas-state rules. |
| FR-07 | Connect to Wi-Fi and retry lost connectivity independently of local safety functions. |
| FR-08 | Publish gas telemetry over MQTT using a documented topic and payload contract. |
| FR-09 | Publish gas alert events over MQTT. |
| FR-10 | Ingest telemetry and alerts in a NestJS backend and expose REST and WebSocket interfaces. |
| FR-11 | Persist devices, historical gas readings, and alerts in PostgreSQL. |
| FR-12 | Provide a realtime web dashboard showing gas level, state, fan state, online/offline status, and a history chart. |
| FR-13 | Provide stored alert history through the backend and dashboard. |
| FR-14 | Send Telegram notifications for WARNING and DANGER events. |
| FR-15 | Send recovery notifications when an active unsafe condition returns to SAFE. |
| FR-16 | Apply anti-spam handling and configurable cooldowns to remote notifications, without suppressing local safety responses. |

Sampling intervals, thresholds, hysteresis, fan rules, payload fields, and cooldown durations must be specified and verified in their implementation phases rather than assumed here.

## Reliability requirements

Local safety features MUST NOT depend on Wi-Fi, MQTT, backend, database, or web dashboard availability. They must also operate without Internet access.

When networking fails:

- Gas sensing continues.
- State detection continues.
- Buzzer operation continues according to the local state.
- LED operation continues according to the local state.
- Fan control continues according to the local state.
- The ESP32 retries connectivity separately, without blocking the safety loop.

Remote service failures must not disable local processing. Reconnection and recovery behavior must be tested explicitly.

## Simulation requirements

Develop and validate the system in Wokwi first. Use a simulated analog gas input when a realistic MQ sensor model is unavailable. Document simulation input ranges and thresholds as simulated values; do not present them as real gas ppm measurements. Maintain circuit definitions in version control when simulation implementation begins.

## Physical hardware requirements

Eventually support ESP32 DevKit V1, MQ-2 or MQ-5 gas sensor, SSD1306 OLED, buzzer, green/yellow/red LEDs, relay, and a DC ventilation fan. Confirm component voltages, ADC input limits, power supply, and relay/fan drive compatibility during hardware integration before energizing the circuit.

## Calibration requirement

Calibrate thresholds on real hardware. Raw ADC readings must not automatically be claimed as ppm. Any ppm conversion requires proper sensor calibration and a documented datasheet-based conversion, including its assumptions and limitations. Simulation thresholds must not be copied to hardware as validated gas concentrations.

## Security and configuration

Never commit secrets, including Wi-Fi passwords, MQTT credentials, Telegram Bot Tokens, database credentials, or API secrets. Add placeholder-only configuration templates when implementing the relevant phase. Keep broker-specific connection details configurable; HiveMQ Cloud is the initial planned broker, not a fixed architecture dependency.
