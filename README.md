# Smart Gas Leak Monitoring, Warning and Response System using ESP32 and IoT

**Thiết kế và xây dựng hệ thống giám sát, cảnh báo và xử lý rò rỉ khí gas thông minh sử dụng ESP32 và IoT**

University prototype with ESP32 raw gas sensing, SAFE/WARNING/DANGER classification, local LEDs/buzzer/OLED and relay ventilation, optional Wi-Fi/MQTT, NestJS/PostgreSQL monitoring, a realtime React dashboard and opt-in Telegram notifications.

## Current status

Software implementation and preparation work for subsequent phases has been delivered in separate phase commits. Phase 0 and backend/database/dashboard Phases 8–10 meet their recorded software exit checks. Other phases retain **IN PROGRESS** where Wokwi, external service, hardware, calibration or final review evidence is still missing. See [plan](plan.md) and append-only [audit](audit.md).

**Actual Wokwi execution, live Telegram delivery, physical ESP32 deployment and calibration remain unverified.** Raw counts are never presented as ppm. The report is a draft awaiting those results.

## Run locally

```sh
python3 scripts/configure-local.py
docker compose --project-directory infrastructure up --build -d
```

Open **http://localhost:8080**. The first command generates an ignored local database password without printing it. Docker image build/startup remains unverified here because base-image metadata retrieval stalled; native backend/frontend builds and isolated PostgreSQL tests passed. See [integration instructions](docs/integration.md) for configuration and alternatives. Do not expose the anonymous development broker publicly.

For native development: Node 22.12+ (tested with Node 24), `npm ci` in backend and frontend, configure each ignored `.env`, then use their README commands. Set DATABASE_URL for durable PostgreSQL storage; without it, the backend explicitly uses bounded ephemeral memory.

## Firmware and final testing

Use [firmware setup](firmware/README.md) and [Wokwi instructions](firmware/wokwi/README.md). `python3 scripts/export-wokwi.py` exports the canonical sources without local credentials. Configure Wi-Fi/broker privately; cloud TLS needs a CA certificate. Default networking is disabled until configured.

```sh
scripts/verify.sh
# Optional isolated DB/integration/outage tests and ESP32 build:
RUN_DOCKER_TESTS=1 RUN_FIRMWARE_BUILD=1 scripts/verify.sh
```

Install dependencies/libraries first. All manual checks are consolidated in [final acceptance](docs/final-acceptance.md), so the user can perform one final acceptance round.

## Architecture

```text
Analog sensor → ESP32 → LEDs / buzzer / OLED / relay → fan
                  └→ Wi-Fi → MQTT → NestJS → PostgreSQL
                                         ├→ REST / Socket.IO → React dashboard
                                         └→ Telegram worker
```

Sensing/classification/local outputs run independently of network calls. The Wokwi relay load is an LED indicator, not a physical motor model. Simulation thresholds are raw 1400/2800 with 150-count hysteresis; real hardware requires reviewed calibration.

| Area | Stack |
| --- | --- |
| Firmware | ESP32 DevKit V1, Arduino Framework C/C++, Arduino IDE 2.x / CLI, Wokwi |
| Messaging | Wi-Fi, configurable MQTT broker; HiveMQ Cloud TLS supported |
| Backend | Node.js, NestJS, MQTT.js, REST, Socket.IO |
| Storage | PostgreSQL 16, versioned SQL migration, pg |
| Dashboard | React, TypeScript, Vite, Recharts |
| Notifications | Telegram Bot API with cooldown/retry worker |

## Repository and references

- [requirements.md](requirements.md): system requirements.
- [plan.md](plan.md): actual phase/task status and exit criteria.
- [audit.md](audit.md): dated execution and verification history.
- [AGENTS.md](AGENTS.md): working and Git policy.
- [docs/architecture.md](docs/architecture.md): implementation boundaries and target architecture.
- [docs/testing.md](docs/testing.md): automated and manual verification.
- [docs/report/final-report.md](docs/report/final-report.md): draft report and limitations.
- `firmware/`: canonical sketch, state/output/display/connectivity headers and circuit configuration.
- `backend/`: ingestion, API, notifications, persistence, migrations and tests.
- `frontend/`: responsive monitoring dashboard and data-handling tests.
- `infrastructure/`: development Compose configuration.
- `scripts/`, `tests/`: build, export, calibration and isolated verification tools.
- `docs/evidence/phase-XX/`: real captured output and clearly labeled software QA screenshots.

Develop and commit one requested phase at a time, verify applicable changes, append audit evidence, and complete phase status only when exit criteria are actually met. Physical deployment follows simulation validation.
