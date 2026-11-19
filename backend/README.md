# NestJS backend

Node.js 22.12+ (tested using Node 24). `npm ci`, copy `.env.example` to ignored `.env`, then `npm run build && npm start`. `npm run dev` loads ignored .env and watches TypeScript; explicit Nest injection tokens keep this source workflow compatible with tsx (which does not emit decorator type metadata).

REST: `GET /api/health`, `/api/devices`, `/api/devices/:id/readings?limit=100`, `/api/alerts?deviceId=...&limit=100`. Socket.IO events: `reading`, `alert`, and `devices` (including stale/offline updates). Historical results are newest first. No remote actuator control is exposed.

Set `MQTT_URL=mqtts://<broker>:8883` and credentials for HiveMQ Cloud, or use the local development broker. TLS certificate verification stays enabled. `APP_TOKEN`, when set, protects REST using Bearer auth and Socket.IO through `auth.token`. Keep the API on localhost unless deliberately deploying behind appropriate HTTPS/authentication. CORS allows configured `WEB_ORIGIN` only.

MQTT data is strictly validated against `src/contracts.ts`, including topic identity, ADC range and fan policy. Retained measurements/events are ignored, alerts are deduplicated by device/boot/sequence, and telemetry becomes stale after 10 seconds by default. Set DATABASE_URL for PostgreSQL persistence and apply npm run migrate; MIGRATE_ON_START=true is available for local development. With no DATABASE_URL, history is bounded ephemeral memory. Health reports storage availability, broker connection and notification queue counters. Telegram is explicitly opt-in; see docs/notifications.md. `npm test` runs actual local MQTT → API/WebSocket integration using a temporary broker.

PostgreSQL migrations now include a durable notification outbox and policy state. Worker row locks preserve device ordering; alert/outbox creation is one transaction. /ack is published only after PostgreSQL commits, also for an already-stored retry. Memory mode deliberately sends no durable ACK. Worker work is drained before the pool closes during graceful shutdown.

Health distinguishes invalid messages from processing/storage errors and exposes ingestion backlog, durability and notification outcomes. Basic tests override live DB/notification configuration; system tests inject a mock Telegram transport. See docs/notifications.md and the hardening evidence for restart/retry guarantees and external-send duplicate limits.
