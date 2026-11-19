# MQTT v1 contract

Topics use `gas-monitor/device/{deviceId}/telemetry`, `/alert`, `/status` and `/ack`. Device IDs contain 1–64 ASCII letters/digits/underscore/hyphen. Configure cloud brokers using TLS/8883, credentials and CA validation. The anonymous plaintext broker is isolated localhost development only.

Payload: version=1, deviceId, 16-hex bootId, unsigned sequence/uptimeMs, rawAdc (0–4095), state/previousState, fanOn, simulated. Optional diagnostics: droppedAlerts, pendingAlerts (0–48), alertJournalHealthy. Receipt time is assigned by backend; device uptime is not a gas concentration or wall-clock timestamp.

Telemetry remains QoS0 every 2s, not retained; obsolete samples are overwritten. It is not a durable sampling log. Alerts represent transitions and have identity deviceId+bootId+sequence. SAFE after unsafe is recovery. `/status` is retained `{"online":true}` with offline Last Will at QoS1; stale telemetry independently expires online status.

## Durable alert acknowledgement

Firmware retains transitions in a checksummed, versioned 32-event Preferences/NVS journal, plus a 16-event RAM ingress queue. Flash operations run only in the core-0 worker. The oldest journal event is retried every 3s until an application ACK arrives on that device's `/ack` topic. The backend emits non-retained QoS1 JSON exactly as `{"eventId":"<bootId>:<sequence>"}` after PostgreSQL alert insertion commits, including when a previously committed duplicate is retried. This identity-only ACK has a canonical byte encoding for the constrained firmware client. No ACK is issued for invalid payloads or failed writes. Memory-only backend mode deliberately does not issue durable ACKs.

A journal entry is removed only after matching ACK and successful local removal persistence. A crash after backend commit but before ACK/removal causes retry; database uniqueness prevents another stored alert/outbox job. Broker ACLs should allow a device to publish its own telemetry/alert/status and subscribe to its own ack; only the backend should publish ACKs.

## Explicit limits

- NVS persistence occurs asynchronously. Events still in RAM before the worker commits them can be lost on sudden power loss; DNS/TLS work can delay that transfer. Events already journaled survive ordinary reboot if NVS is intact.
- Capacity is bounded: 32 journal plus 16 ingress events. New transitions beyond capacity increment droppedAlerts. Periodic telemetry still reports the current state, queue depth and journal health; do not infer complete offline history.
- NVS unavailable, full, corrupt, unsupported-version or identity-mismatched data is reported as unhealthy. Corrupt/foreign stored data is not silently overwritten; current work uses RAM fallback or retries failed writes. Local safety continues. A device-ID change must follow draining/reviewing its old journal.
- Only transitions and ACK removals cause journal writes; periodic telemetry is never written to NVS. Flash endurance, power cuts and corruption recovery require final hardware acceptance.
- Data publish is still QoS0; application ACK improves transition delivery to PostgreSQL, not exactly-once transport or unlimited losslessness.

TLS is never set insecure. Supply CA PEM and clock synchronization for cloud TLS. Reconnect is isolated from local sampling/outputs.

References: [PubSubClient API](https://pubsubclient.knolleary.net/api), [ESP32 Preferences](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/preferences.html).
