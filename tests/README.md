# Verification

Run `scripts/verify.sh` for native firmware logic/config guards, calibration unit tests, backend MQTT/API/WebSocket/auth/notification tests, frontend tests and production build. Install backend/frontend dependencies first using npm ci.

Set RUN_DOCKER_TESTS=1 for isolated real PostgreSQL migration, full software-path integration and outage/recovery tests. These use uniquely named throwaway containers and generated credentials, never the project DB. Set RUN_FIRMWARE_BUILD=1 with Arduino libraries configured to include ESP32 compilation.

The software-path fixture and mock Telegram are explicitly synthetic. Real Wokwi, actual Telegram delivery, calibrated hardware and airflow tests are in docs/final-acceptance.md. Curated evidence is under docs/evidence/phase-XX/.

Hardening adds journal corruption/schema migration, warm-up/rail/recovery/timer-wrap checks, PostgreSQL outbox restart/cooldown/recovery-after-delivery-failure, concurrent worker claims and actual MQTT ACK after DB commit. `python3 tests/compose-smoke.py` (or RUN_COMPOSE_TESTS=1) builds/starts a unique temporary full stack and cleans only its own resources. This includes public image downloads and can take longer on first use. No real bot tokens or hardware are used.
