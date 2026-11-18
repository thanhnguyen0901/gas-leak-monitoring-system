# Smart Gas Leak Monitoring, Warning and Response System using ESP32 and IoT

**Thiết kế và xây dựng hệ thống giám sát, cảnh báo và xử lý rò rỉ khí gas thông minh sử dụng ESP32 và IoT**

Implementation report draft — 2026-11-18. Final experimental results and review are pending.

## Objective and method

Implement an ESP32 university prototype with continuous gas monitoring, three local gas states, local warning/ventilation, IoT monitoring and remote notifications. Development is incremental with version-controlled circuit definitions and separate commits per phase. At the user's request, later software implementation proceeded before the deferred final Wokwi/manual acceptance round. Actual physical deployment still requires validated simulation and calibration.

The analog potentiometer is a controllable signal model; its raw values are not measured gas concentration. MQ-2/MQ-5 integration is prepared through wiring guidance and a guarded physical profile. No actual hardware was connected or calibrated during this work.

## Implemented design

The canonical firmware remains named gas_input_simulation for path compatibility. It samples ADC1/GPIO34 at 12 bits every 500 ms, classifies raw values and controls green/yellow/red LEDs, buzzer and relay. Demonstration state entry thresholds are 1400 and 2800; recovery requires values strictly below 1250 and 2650. Invalid readings/configuration fail to DANGER; invalid configured thresholds also fail compilation.

The local control loop runs on ESP32 core 1. A dedicated core-0 worker handles Wi-Fi, clock synchronization, TLS and MQTT; a separate worker handles OLED I2C. Queue operations from the local loop never wait for network or display operations. The relay enables ventilation in WARNING and DANGER and disables it in SAFE after recovery hysteresis. The simulated relay load is a blue LED, not a motor model.

MQTT v1 carries raw readings and transitions, boot/session identity, sequence, state, fan state, uptime and a simulation flag. Online status uses a retained status topic/Last Will plus backend stale-reading expiry. TLS never disables certificate verification. Credentials remain in ignored local configuration/environment files.

NestJS ingests validated MQTT messages, rejects mismatched identities, duplicates and known retired boot readings, and exposes REST/Socket.IO monitoring. PostgreSQL stores devices, readings and alerts using transactions, migrations, uniqueness and value constraints. A React/TypeScript/Vite dashboard displays realtime ADC, states, fan status, offline status, charts and recovery/alert history.

Telegram is opt-in and server-side. A separate bounded worker sends WARNING, DANGER and recovery with cooldown, deduplication and retry/backoff. Automated tests inject a mock delivery function; no real messages were sent.

## Actual verification results

| Check | Observed result | Evidence |
| --- | --- | --- |
| State engine | Boundaries, hysteresis, direct jumps, invalid input and all 4096 raw values passed native tests | Phase 2 / consolidated Phase 16 |
| Outputs | LED/fan mapping and buzzer cadence passed native tests | Phases 3/5/16 |
| Default ESP32 build after display isolation | 401807 flash bytes, 30216 global RAM bytes; compilation succeeded | Phase 15/build.txt |
| Network-enabled simulation profile at Phase 13 | 1056321 flash bytes, 49644 global RAM bytes; linked successfully | Phase 13/network-profile-build.txt |
| Backend | Seven automated tests including auth, actual MQTT/REST/WebSocket and mock notification policy passed | Phase 16/automated-suite.txt |
| PostgreSQL | Real isolated migration, uniqueness/constraints and restart-history tests passed | Phases 9/16 |
| Software full path | Synthetic SAFE → WARNING → DANGER → SAFE reached DB, API/WebSocket and mock Telegram | Phases 12/16 |
| Recovery | Actual temporary broker shutdown/restart and DB pause/unpause recovered | Phases 15/16 |
| Dashboard | TypeScript/Vite build and two data tests passed; desktop/mobile/offline browser QA inspected using synthetic readings | Phases 10/16 |
| Calibration utility | Two synthetic-fixture tests passed; output never approves calibration or claims ppm | Phases 14/16 |
| Docker packaging | Compose syntax valid; image build interrupted during base-image metadata retrieval | Phase 12/docker-build.txt; startup NOT VERIFIED |

Evidence paths are relative to docs/evidence/phase-XX/. Screenshots are actual browser captures of clearly labeled software QA data, not physical experiments.

## Pending experiments and limitations

Wokwi execution and low/middle/high measurements remain unobserved. Live HiveMQ TLS connectivity, Telegram bot delivery, real circuit wiring, physical firmware deployment, sensor calibration, motor operation/airflow, reset behavior and physical outage safety have not been verified. Complete docs/final-acceptance.md before final submission.

Data publishing is QoS0; firmware retains only the latest sample and 16 RAM transition events. Offline telemetry, dropped events and RAM state do not survive power loss. Backend notifications/cooldowns are not a durable outbox. Failed database ingestion may lose individual messages. Memory storage mode is ephemeral. A floating/disconnected analog sensor is not reliably detected. Physical voltage scaling, heater warm-up, relay polarity/current ratings and fan suppression require measured review.

The midpoint calibration tool produces candidate raw thresholds from separated measured reference groups, requiring human review. It does not derive gas-specific sensor resistance/R0, approve safe concentrations or implement ppm conversion. This prototype is not a certified gas safety device.

## Conclusion and remaining report work

The software architecture and repeatable automated checks are delivered. Full experimental validation is pending the user's final round. Add the exact physical component list, wiring photographs, calibration references, repeated measurements, end-to-end screenshots, actual defects and reviewed limitations before marking the report final.

See [requirements coverage](requirements-coverage.md), [architecture](../architecture.md), [testing](../testing.md) and [acceptance checklist](../final-acceptance.md).
