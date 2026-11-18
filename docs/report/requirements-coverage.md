# Requirements coverage — 2026-11-18 draft

Implementation coverage is not a claim of physical acceptance.

| ID | Implementation | Verification / remaining work |
| --- | --- | --- |
| FR-01 | ADC sampling / GasState.h | ESP32 build + native logic; Wokwi/real input pending |
| FR-02 | GasState.h; configurable raw thresholds/hysteresis | Native tests passed; real threshold calibration pending |
| FR-03 | LocalOutputs.h; LED circuit | Policy tests passed; actual LED observation pending |
| FR-04 | LocalOutputs.h; LEDC buzzer | Cadence tests passed; actual audible response pending |
| FR-05 | Display.h; SSD1306 task | Compile passed; actual display pending |
| FR-06 | LocalOutputs.h; relay33 | Policy tests passed; real fan/airflow pending |
| FR-07 | Connectivity.h core-0 Wi-Fi task | Network-enabled build passed; AP outage pending |
| FR-08 | Connectivity.h; MQTT contract | Firmware build + synthetic producer ingestion passed; ESP32 delivery pending |
| FR-09 | Transition queue and alert topic | Synthetic transitions reached history; ESP32 delivery pending |
| FR-10 | backend/src/monitor.ts, app.ts, gateway.ts | Real local broker/API/WebSocket tests passed |
| FR-11 | storage.ts + migrations/001_initial.sql | Real PostgreSQL persistence/restart tests passed |
| FR-12 | frontend/src/main.tsx, data.ts | Build/data tests + desktop/mobile/offline browser QA passed; hardware data pending |
| FR-13 | Alert persistence, REST and dashboard table | API/history integration + browser QA passed |
| FR-14 | backend/src/telegram.ts | Mock delivery passed; live bot/chat pending |
| FR-15 | Recovery events and notification policy | Mock recovery test passed; live Telegram pending |
| FR-16 | Bounded notification worker/cooldown | Duplicate, cooldown, escalation, retry and limit tests passed; live acceptance pending |

Reliability: local loop contains no network or OLED I2C calls; actual ESP32 outage behavior remains pending. Simulation: circuit and source export exist, Wokwi execution pending. Hardware/calibration: preparation and review tools exist, measurements pending. Secrets: local header/environment files are ignored; example fields are empty. See audit and final acceptance for current evidence.
