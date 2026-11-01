# Smart Gas Leak Monitoring, Warning and Response System using ESP32 and IoT

**Thiết kế và xây dựng hệ thống giám sát, cảnh báo và xử lý rò rỉ khí gas thông minh sử dụng ESP32 và IoT**

A university embedded systems project planned to monitor gas levels, classify SAFE / WARNING / DANGER states, provide local warnings and ventilation, and expose remote monitoring and notifications.

## Current status

**Phase 0 - Project Initialization** — IN PROGRESS. This repository contains documentation and directory placeholders only. The full system is not implemented. Prior environment and LED simulation checks are recorded in [audit.md](audit.md).

## Planned architecture

```text
Gas sensor → ESP32 → LEDs / Buzzer / OLED / Relay → Fan
                └→ Wi-Fi → MQTT → NestJS → PostgreSQL
                                      ├→ REST / WebSocket → React dashboard
                                      └→ Telegram
```

Gas classification, warnings, and fan control must operate locally even when networking and remote services are unavailable.

## Planned technology stack

| Area | Direction |
| --- | --- |
| Embedded | ESP32 DevKit V1, Arduino Framework, C/C++, Arduino IDE 2.x |
| Simulation | Wokwi, version-controlled circuit JSON |
| Connectivity | Wi-Fi, MQTT; HiveMQ Cloud initially, configurable broker |
| Backend | Node.js, NestJS, MQTT subscriber, REST, WebSocket |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite, Recharts or equivalent |
| Notifications | Telegram Bot API |

## Repository structure

```text
.
├── README.md
├── AGENTS.md
├── requirements.md
├── plan.md
├── audit.md
├── .gitignore
├── docs/
│   ├── architecture.md
│   ├── testing.md
│   ├── decisions/README.md
│   ├── diagrams/README.md
│   ├── evidence/README.md
│   └── report/README.md
├── firmware/
│   ├── README.md
│   ├── src/.gitkeep
│   └── wokwi/
│       ├── README.md
│       └── .gitkeep
├── backend/README.md
├── frontend/README.md
├── infrastructure/README.md
└── tests/README.md
```

## Project references

- [Requirements: what the system must do](requirements.md)
- [Plan: phases and exit criteria](plan.md)
- [Audit: completed and verified work](audit.md)
- [Agent working instructions](AGENTS.md)
- [Target architecture](docs/architecture.md)
- [Future testing strategy](docs/testing.md)

## Development strategy

Develop in simulation first, work on one requested phase at a time, verify the result, append audit evidence, commit only when explicitly requested, then move to the next requested phase. Physical hardware integration and calibrated thresholds follow simulation validation.
