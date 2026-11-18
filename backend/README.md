# NestJS backend

Node.js 22+ (tested using Node 24). `npm ci`, copy `.env.example` to ignored `.env`, then `npm run build && npm start`. `npm run dev` uses current process environment; start with `node --env-file=.env --import tsx src/main.ts` if loading the file directly in development.

REST: `GET /api/health`, `/api/devices`, `/api/devices/:id/readings?limit=100`, `/api/alerts?deviceId=...&limit=100`. Socket.IO events: `reading`, `alert`, and `devices` (including stale/offline updates). Historical results are newest first. No remote actuator control is exposed.

Set `MQTT_URL=mqtts://<broker>:8883` and credentials for HiveMQ Cloud, or use the local development broker. TLS certificate verification stays enabled. `APP_TOKEN`, when set, protects REST using Bearer auth and Socket.IO through `auth.token`. Keep the API on localhost unless deliberately deploying behind appropriate HTTPS/authentication. CORS allows configured `WEB_ORIGIN` only.

MQTT data is strictly validated against `src/contracts.ts`, including topic identity, ADC range and fan policy. Retained measurements/events are ignored, alerts are deduplicated by device/boot/sequence, and telemetry becomes stale after 10 seconds by default. In-memory history is bounded and temporary in this initial backend phase. `npm test` runs actual local MQTT → API/WebSocket integration using a temporary broker.
