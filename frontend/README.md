# React monitoring dashboard

Node 22.12+; `npm ci`, copy `.env.example` to ignored `.env`, then `npm run dev`. API defaults to http://localhost:3000. Set backend WEB_ORIGIN to match the dashboard origin (default http://localhost:5173). `npm run build` checks TypeScript and produces Vite output; `npm test` verifies history merging, deduplication and offline handling.

Features: device selection, raw ADC value, SAFE/WARNING/DANGER, fan state, online/offline, live Socket.IO updates, history chart and alert history including recovery. No fake readings are generated. On disconnect, last reported values remain explicitly historical and the device is shown offline. Reconnection refreshes REST history as well as resubscribing to events. No actuator controls are provided.

VITE_APP_TOKEN is an optional browser read token; it is visible to the browser user. Never put MQTT credentials, database passwords or Telegram tokens in any VITE_ variable. Charts show raw ADC only, never ppm. Typography uses Google Fonts with local system fallback when unavailable.
