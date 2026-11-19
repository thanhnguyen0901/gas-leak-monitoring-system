# Integrated development and final simulation

## Start local services

From repository root:

```sh
python3 scripts/configure-local.py
docker compose --project-directory infrastructure up --build -d
```

Open http://localhost:8080 (use **localhost**, matching CORS), API at http://localhost:3000/api/health. Stop with `docker compose --project-directory infrastructure down`; this preserves database volume. Never use `down -v` unless intentionally discarding local data. The local anonymous MQTT broker is bound to host loopback only, not a public deployment.

For HiveMQ Cloud, edit ignored `infrastructure/.env` MQTT_URL/USER/PASSWORD and configure the same broker in ignored firmware config.local.h. Wokwi in the browser cannot reach the computer's localhost broker through the public gateway; use a reachable TLS broker such as HiveMQ Cloud, or configure Wokwi Private IoT Gateway separately. Do not expose the anonymous development broker publicly.

Docker images and isolated startup/storage/MQTT/HTTP smoke checks passed on 2026-11-19. The frontend build stage uses node:22-bookworm-slim; an Alpine builder failed in a native Rollup parser. See hardening evidence.

Telegram is explicitly opt-in. Configure bot/chat server-side and verify real warning/danger/recovery messages manually. Compose passes optional APP_TOKEN as the browser-visible VITE_APP_TOKEN read token. It is not a place for MQTT/database/Telegram credentials. For manual frontend builds, set a matching VITE_APP_TOKEN locally. Keep Internet deployments behind appropriate HTTPS/user authentication. Never pass service credentials through Vite variables.

## Automated software integration

```sh
cd backend && npm ci && cd ..
python3 tests/run-postgres.py --suite system
```

This creates isolated real PostgreSQL and a temporary MQTT broker. A synthetic device sends SAFE → WARNING → DANGER → SAFE. The test verifies PostgreSQL, REST, actual WebSocket events and mock Telegram notifications. It does **not** execute ESP32 firmware, Wokwi, browser interaction, or live Telegram. The temporary DB is removed automatically.

## Full Wokwi acceptance — pending

Copy the canonical sketch and all its sibling headers plus `libraries.txt` and `diagram.json` into an ESP32 Arduino Wokwi project. Add local config with Wokwi-GUEST, broker CA and credentials privately. Sweep raw ADC through 0, 1400, 2800 and back below 2650/1250. Observe LEDs, cadence, OLED and relay load indicator while checking API, chart, alert history and Telegram. Save real Serial/screenshots only. See `final-acceptance.md` for the consolidated checklist.

## Durability and service diagnostics

Apply migrations (or use the local MIGRATE_ON_START convenience) before starting the backend. Migration and runtime share DATABASE_SSL=true verification settings; URL sslmode cannot weaken that explicit policy. Back up the project DB before deployment changes. The generated local password is URL-safe; manually changed URI-special passwords require correct DATABASE_URL encoding.

PostgreSQL mode persists alert/outbox insertion atomically, cooldown and unsafe episode state. Dashboard health exposes pending/failed jobs and memory-mode limitations. Failed jobs remain available for operator review; do not blindly resend old incidents without checking timestamps/current state. A crash after a Telegram send and before its SQL commit can duplicate delivery.

Firmware removes a transition only after matching /ack and a persisted local removal. Memory-only backend mode does not issue durable ACKs; configure DATABASE_URL for real end-to-end acceptance. Review sensor-health.md and mqtt-contract.md before flash/reboot/outage tests.

For isolated container QA: `python3 tests/compose-smoke.py`. It uses public images, generated credentials, temporary registry configuration without personal credential helpers, random localhost ports, and a unique Compose project. Only that test project's resources are removed afterward. It does not send Telegram messages or touch physical hardware.

Optional local port/origin overrides are in infrastructure/.env.example. PUBLIC_API_URL must match the externally reachable backend origin; WEB_ORIGIN must exactly match the dashboard origin. Native development `cd backend && npm run dev` loads .env and watches TypeScript using explicit Nest injection tokens.
