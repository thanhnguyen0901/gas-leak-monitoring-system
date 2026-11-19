# Verification strategy and actual boundaries

Use `scripts/verify.sh` after installing dependencies. It runs portable state/output tests, config guards, calibration utility tests, backend MQTT/API/WebSocket/auth/notification tests, frontend history/offline tests and a production Vite build. Enable RUN_DOCKER_TESTS=1 for isolated PostgreSQL storage, full software-path and outage/recovery suites; enable RUN_FIRMWARE_BUILD=1 for the ESP32 build with Arduino libraries installed.

Actual captured results are under `evidence/phase-XX/`. Phase 16's automated-suite.txt is the consolidated run. Phase 13 records the earlier network-enabled build; the current hardening folder contains final default/network/diagnostic profile builds. Phase 15 retains the earlier display-isolation build. Phase 10 screenshots use explicitly synthetic software-preview MQTT data, not Wokwi or a physical sensor.

| Area | Automated coverage | Still needs acceptance |
| --- | --- | --- |
| Firmware | ESP32 builds; native thresholds, hysteresis, jumps, invalid inputs, outputs/cadence and hardware config guard | Wokwi/physical timing and outputs |
| OLED/relay/fan | Firmware compiles; output policy tested | Actual display, stuck bus, relay polarity, motor current/airflow |
| MQTT/backend | Temporary broker → NestJS → REST/real WebSocket, validation/dedup, broker reconnect | ESP32 broker outage, HiveMQ TLS credentials and delivery |
| Database | Real PostgreSQL migration/idempotence/constraints, restart history, pause/unpause | Deployment retention/backups and full hardware path |
| Dashboard | Build/data tests; desktop/mobile browser QA and backend-offline view | Live ESP32 acceptance and longer operation |
| Telegram | Mock transport: warning/danger/recovery, cooldown, duplicates, rate-limit retry and bounded queue | Real bot/chat and Internet outage |
| Calibration | Synthetic-fixture input validation/candidate generation, never approval or ppm | Measured references and reviewed real thresholds |
| Full path | Synthetic device → MQTT → PostgreSQL → API/WebSocket → mock Telegram | Wokwi and calibrated hardware → real Telegram |

The user requested final manual acceptance after implementation. Follow [the single acceptance checklist](final-acceptance.md); record setup, actual input/output, failures and limitations. Append audit entries and check phase tasks only when verified. Never generate screenshots or measurements to stand in for missing tests.

## Hardening verification — 2026-11-19

See evidence/hardening-2026-11-19/ for the current final suite, native sensor/journal migration tests, config guards, real PostgreSQL notification restart/row-lock/retry tests and application ACK/no-ACK-during-DB-failure cases. Additional browser captures use an explicitly synthetic quality/queue fixture; mobile overflow and offline health labeling were checked. Full isolated Compose image build/startup/MQTT persistence/HTTP checks now pass after switching the frontend builder from Alpine to Debian. Native development startup was also exercised.

RUN_COMPOSE_TESTS=1 optionally includes the scoped Compose smoke test. This is not physical ESP32 power-cut or Wokwi evidence; the single final acceptance checklist retains those checks.
