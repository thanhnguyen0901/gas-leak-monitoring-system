# Telegram delivery and recovery

Explicitly enable NOTIFICATIONS_ENABLED and configure TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID server-side. Automated tests use mock transport only.

With PostgreSQL configured, alert insertion and notification-outbox insertion commit atomically. Pending jobs, attempts, retry times, cooldown and last delivered unsafe state survive backend restarts. Per-device ordering and row locks prevent simultaneous workers claiming the same job. Recovery uses persisted unsafe state. New DANGER incidents and escalation bypass a previous incident cooldown; repeated severity within the active incident is rate-limited. Memory-only mode remains explicitly non-durable.

HTTP requests time out after 5 seconds; delivery retries up to 5 attempts with backoff and Telegram retry_after. Failed jobs remain visible in database/health instead of disappearing. A send accepted by Telegram followed by a crash before the database commit can still be delivered again: exactly-once delivery cannot be promised across an external HTTP service and SQL transaction. Local sensing and ingestion do not wait for delivery.

Notification worker reads are separate from local safety. An HTTP/database failure rolls back or reschedules the durable job. Outbox state and counts are observable via /api/health. See final acceptance for live bot/chat and restart checks.
