# MQTT v1 contract

Topics: `gas-monitor/device/{deviceId}/telemetry`, `/alert`, `/status`. Device IDs are 1–64 ASCII letters/digits/underscore/hyphen. Broker is configurable: HiveMQ Cloud uses TLS/8883 with CA certificate and credentials; anonymous plaintext is only for the isolated local development broker.

Telemetry is published every 2 seconds, not retained. State transitions publish alert events. The shared payload is JSON with `version: 1`, `deviceId`, 16-hex `bootId`, unsigned `sequence`, `uptimeMs`, integer `rawAdc` (0–4095), `state`, `previousState` (SAFE/WARNING/DANGER), boolean `fanOn`, and `simulated`. Time of receipt is assigned by backend; device uptime is not wall-clock time or ppm. Alert identity is deviceId + bootId + sequence. Startup emits an alert if its first input is unsafe. SAFE transition from WARNING/DANGER is recovery.

Retained `/status` is `{ "online": true }`; Last Will is `{ "online": false }` at QoS 1. Backend also times out stale telemetry after 10 seconds; broker status alone is insufficient to establish a fresh reading.

Firmware publishes data at QoS 0 (PubSubClient limitation). A 16-event RAM queue retains transitions during short outages; after it fills, newer events are dropped with a Serial message, while local safety continues. Latest telemetry overwrites its one-slot queue; obsolete samples are not replayed. There is no durable offline history or guaranteed broker acknowledgement. Backend deduplicates alert identities. These limits must be considered in final outage testing.

TLS validation is never disabled: supply CA PEM and allow NTP clock synchronization for cloud TLS. Worker reconnect attempts are spaced 10 seconds apart. DNS/TLS/broker work runs exclusively on core 0; sampling and local outputs never wait for it.

Sources: [PubSubClient API](https://pubsubclient.knolleary.net/api), [ESP32 TLS](https://github.com/espressif/arduino-esp32/tree/master/libraries/NetworkClientSecure).
