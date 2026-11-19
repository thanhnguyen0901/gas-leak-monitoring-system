# Smart Gas Leak Monitoring, Warning and Response System using ESP32 and IoT

**Thiết kế và xây dựng hệ thống giám sát, cảnh báo và xử lý rò rỉ khí gas thông minh sử dụng ESP32 và IoT**

Implementation report draft — 2026-11-19 (reliability hardening revision). Final experimental results and review are pending.

## Objective and method

Implement an ESP32 university prototype with continuous gas monitoring, three local gas states, local warning/ventilation, IoT monitoring and remote notifications. Development is incremental with version-controlled circuit definitions and separate commits per phase. At the user's request, later software implementation proceeded before the deferred final Wokwi/manual acceptance round. Actual physical deployment still requires validated simulation and calibration.

The analog potentiometer is a controllable signal model; its raw values are not measured gas concentration. MQ-2/MQ-5 integration is prepared through wiring guidance and a guarded physical profile. No actual hardware was connected or calibrated during this work.

## Implemented design

The canonical firmware remains named gas_input_simulation for path compatibility. It samples ADC1/GPIO34 at 12 bits every 500 ms, classifies raw values and controls green/yellow/red LEDs, buzzer and relay. Demonstration state entry thresholds are 1400 and 2800; recovery requires values strictly below 1250 and 2650. Invalid readings/configuration fail to DANGER; invalid configured thresholds also fail compilation.

The local control loop runs on ESP32 core 1. A dedicated core-0 worker handles Wi-Fi, clock synchronization, TLS and MQTT; a separate worker handles OLED I2C. Queue operations from the local loop never wait for network or display operations. The relay enables ventilation in WARNING and DANGER and disables it in SAFE after recovery hysteresis. The simulated relay load is a blue LED, not a motor model.

MQTT v1 carries raw readings and transitions, boot/session identity, sequence, state, fan state, uptime and a simulation flag. Online status uses a retained status topic/Last Will plus backend stale-reading expiry. TLS never disables certificate verification. Credentials remain in ignored local configuration/environment files.

NestJS ingests validated MQTT messages, rejects mismatched identities, duplicates and known retired boot readings, and exposes REST/Socket.IO monitoring. PostgreSQL stores devices, readings and alerts using transactions, migrations, uniqueness and value constraints. A React/TypeScript/Vite dashboard displays realtime ADC, states, fan status, offline status, charts and recovery/alert history.

Telegram is opt-in and server-side. A separate worker sends WARNING, DANGER and recovery with cooldown, deduplication and retry/backoff. With PostgreSQL, alert/outbox insertion is atomic and pending jobs, retry schedule and unsafe/cooldown state survive restart. Recovery remains eligible even when earlier unsafe delivery attempts failed. Automated tests inject a mock delivery function; no real messages were sent.

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
| Docker packaging | Isolated image builds, service startup, MQTT persistence and dashboard HTTP passed on 2026-11-19 after switching frontend builder to Debian | hardening-2026-11-19/compose-smoke-final.txt |

The phase results above retain their original verification context; current hardening results below supersede earlier implementation limitations. Phase paths are relative to docs/evidence/phase-XX/. Screenshots are actual browser captures of clearly labeled software QA data, not physical experiments.

## Reliability hardening and current software results — 2026-11-19

- Added checksum-verified migrations and transactional PostgreSQL notification outbox with per-device ordering/concurrent worker locks. Restart/cooldown/recovery tests use real PostgreSQL and mock Telegram; unsafe-delivery exhaustion does not suppress the subsequent valid recovery.
- Added bounded NVS transition journal, previous-format migration, durable application ACK, duplicate retry handling and drop/depth/journal-health metrics. Native image corruption/order/migration tests and actual broker/DB no-ACK-on-failed-write tests passed. Actual flash power-cut behavior remains unverified.
- Added configurable warm-up, sustained rail attention, debounced recovery and explicit sensor labels. Quality-only transitions are stored/notified even when gas state remains DANGER; simulated raw values still never become ppm.
- Added operational health panels and explicit memory-mode/offline warnings. Browser desktop/mobile checks use synthetic quality/queue data; no horizontal document overflow was observed after resize settled. The chart is lazy loaded: startup JS is about 278kB with a separate roughly 422kB chart chunk.
- Final automated suite: 12 backend tests, 4 frontend tests/build, portable state/output/sensor/journal checks, config guards, 2 calibration tests, real PostgreSQL storage, 4 software/outbox integration tests and broker/DB failure tests passed. Default and network/diagnostic-enabled ESP32 build outputs are captured in the hardening evidence.
- Complete isolated Compose packaging/startup/storage/broker/API/frontend smoke passed. The first Alpine frontend-builder attempt failed in a native bundler; the Debian builder was then validated. Native development startup with source watching was exercised as well.

Current evidence is under docs/evidence/hardening-2026-11-19/. These checks do not establish physical calibration, motor/relay suitability, real Internet/TLS credentials or live Telegram delivery.

## Pending experiments and limitations

Wokwi execution and low/middle/high measurements remain unobserved. Live HiveMQ TLS connectivity, Telegram bot delivery, real circuit wiring, physical firmware deployment, sensor calibration, motor operation/airflow, reset behavior and physical outage safety have not been verified. Complete docs/final-acceptance.md before final submission.

Periodic telemetry is QoS0 and is not a durable offline sample history. Firmware retains up to 32 transitions in a checksummed NVS journal plus 16 volatile ingress events; it removes a journaled event only after PostgreSQL application ACK and persisted local removal. A power cut before NVS commit or overflow can still lose events. PostgreSQL notifications/cooldowns and observed-unsafe state are now durable. Failed alert writes receive no ACK for retry; failed telemetry writes may still lose samples. Telegram may duplicate if a remote send succeeds and the process crashes before SQL commit. Memory storage mode is ephemeral. Warm-up and sustained ADC rails have explicit diagnostic/fail-safe handling, but a floating/disconnected intermediate analog signal is not reliably detected. Physical voltage scaling, heater warm-up, relay polarity/current ratings and fan suppression require measured review.

The midpoint calibration tool produces candidate raw thresholds from separated measured reference groups, requiring human review. It does not derive gas-specific sensor resistance/R0, approve safe concentrations or implement ppm conversion. This prototype is not a certified gas safety device.

## Conclusion and remaining report work

The software architecture and repeatable automated checks are delivered. Full experimental validation is pending the user's final round. Add the exact physical component list, wiring photographs, calibration references, repeated measurements, end-to-end screenshots, actual defects and reviewed limitations before marking the report final.

See [requirements coverage](requirements-coverage.md), [architecture](../architecture.md), [testing](../testing.md) and [acceptance checklist](../final-acceptance.md).
