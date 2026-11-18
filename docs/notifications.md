# Telegram notifications

Set backend `NOTIFICATIONS_ENABLED=true`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and optionally `NOTIFICATION_COOLDOWN_MS` (default 60000). Tokens remain server-side only. Automated tests use injected mock delivery functions and never contact Telegram.

WARNING and DANGER state events enqueue messages; escalation to DANGER bypasses a WARNING cooldown. Repeated events of the same severity/device within cooldown are suppressed. Recovery is sent only after an unsafe notification was successfully delivered. Local safety and MQTT ingestion never wait for HTTP delivery. Messages include event receipt time and identity so delayed notifications are recognizably historical.

The bounded RAM queue holds 256 events. A worker retries failures up to 5 attempts with exponential backoff and honors Telegram retry_after. A hung HTTP request times out after 5 seconds. Queue overflow and exhausted retries increment dropped counters. Notification queue and cooldown state are not durable across backend restart; PostgreSQL alert history remains the durable record. This limitation must be reviewed during final acceptance. Live Telegram delivery requires manual verification with the user's bot/chat.

API: [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage), [response parameters](https://core.telegram.org/bots/api#responseparameters).
