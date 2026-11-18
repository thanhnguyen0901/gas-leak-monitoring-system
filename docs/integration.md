# Integrated development and final simulation

## Start local services

From repository root:

```sh
python3 scripts/configure-local.py
docker compose --project-directory infrastructure up --build -d
```

Open http://localhost:8080 (use **localhost**, matching CORS), API at http://localhost:3000/api/health. Stop with `docker compose --project-directory infrastructure down`; this preserves database volume. Never use `down -v` unless intentionally discarding local data. The local anonymous MQTT broker is bound to host loopback only, not a public deployment.

For HiveMQ Cloud, edit ignored `infrastructure/.env` MQTT_URL/USER/PASSWORD and configure the same broker in ignored firmware config.local.h. Wokwi in the browser cannot reach the computer's localhost broker through the public gateway; use a reachable TLS broker such as HiveMQ Cloud, or configure Wokwi Private IoT Gateway separately. Do not expose the anonymous development broker publicly.

Telegram is explicitly opt-in. Configure bot/chat server-side and verify real warning/danger/recovery messages manually. If setting APP_TOKEN for a manual frontend build, set matching VITE_APP_TOKEN locally; the standard Compose frontend uses no token. Never pass service credentials through Vite variables.

## Automated software integration

```sh
cd backend && npm ci && cd ..
python3 tests/run-postgres.py --suite system
```

This creates isolated real PostgreSQL and a temporary MQTT broker. A synthetic device sends SAFE → WARNING → DANGER → SAFE. The test verifies PostgreSQL, REST, actual WebSocket events and mock Telegram notifications. It does **not** execute ESP32 firmware, Wokwi, browser interaction, or live Telegram. The temporary DB is removed automatically.

## Full Wokwi acceptance — pending

Copy the canonical sketch and all its sibling headers plus `libraries.txt` and `diagram.json` into an ESP32 Arduino Wokwi project. Add local config with Wokwi-GUEST, broker CA and credentials privately. Sweep raw ADC through 0, 1400, 2800 and back below 2650/1250. Observe LEDs, cadence, OLED and relay load indicator while checking API, chart, alert history and Telegram. Save real Serial/screenshots only. See `final-acceptance.md` for the consolidated checklist.
