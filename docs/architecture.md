# Target Architecture - Not Fully Implemented Yet

Software components are implemented; full simulation and calibrated physical acceptance are pending. This title describes the complete hardware-plus-service target, not an assertion that only placeholders exist.

```text
Gas Sensor (potentiometer for Wokwi)
    |
    v
ESP32 core 1: sample → state engine → LEDs / buzzer / relay → fan
    |                      |
    |                      +→ one-frame queue → OLED task (core 0)
    +→ latest snapshot + 16 RAM / 32 NVS events → Wi-Fi / MQTT task (core 0)
                                           |
                                        MQTT broker
                                           |
                                      NestJS backend
                                 /             |           \
                         PostgreSQL      REST / Socket.IO   Telegram worker
                                                |
                                         React dashboard
```

## Local safety

GPIO34/ADC1 readings are sampled every 500 ms at 12-bit resolution. The portable engine classifies using configured raw thresholds and recovery hysteresis. GPIO25/26/27 LEDs, GPIO32 buzzer and GPIO33 relay are controlled only by the local loop. Wi-Fi, DNS, NTP, TLS, MQTT and backend state are never prerequisites for those outputs. OLED I2C runs in a separate task and uses a one-frame queue.

Default simulation thresholds are 1400/2800 with 150-count hysteresis. Physical mode requires explicit calibration confirmation, valid raw thresholds and a positive reviewed warm-up duration. Unready/latched rail quality drives conservative DANGER outputs and explicit reason labels; quality-only changes produce events. Floating sensor inputs, reset/brownout behavior and fan electrical operation still need physical review; compilation cannot validate those properties.

## MQTT and remote services

Implemented v1 topics:

```text
gas-monitor/device/{deviceId}/telemetry
gas-monitor/device/{deviceId}/alert
gas-monitor/device/{deviceId}/status
```

See [payload/QoS contract](mqtt-contract.md). The broker is configurable; HiveMQ Cloud can use TLS/8883 with CA validation. Default empty SSID keeps networking disabled. Reconnect runs on core 0. No remote actuator-command topic is implemented.

NestJS validates topic identity and payloads, serializes bounded ingestion, drops duplicate/older readings, persists history when DATABASE_URL is configured, broadcasts Socket.IO updates and exposes read-only REST. Latest readings expire as online data after a configurable stale interval. PostgreSQL transactions and unique identifiers prevent duplicate stored events. Memory mode is explicitly temporary.

The Telegram worker processes warning/danger/recovery independently from ingestion, with cooldown and bounded retries. When PostgreSQL is configured, alert and notification-outbox insertion commit atomically; per-device cooldown/observed unsafe state survives restart. A recovery can still be delivered when earlier unsafe notification attempts failed. In memory-only mode these guarantees remain volatile. The browser receives raw counts and server receipt times, never a calibrated ppm estimate.

## Implementation limits

The Wokwi blue LED represents the relay's fan load only. Firmware keeps a bounded transition journal and waits for application ACK after PostgreSQL commit; periodic QoS0 telemetry is still not a durable offline log. New events in RAM before NVS commit may be lost on abrupt power loss. External Telegram delivery is not exactly-once across a send/SQL-commit crash. Warm-up and sustained rail diagnostics do not reliably identify floating wires. There is no ppm conversion or certified physical safety claim. Review [failure matrix](failure-matrix.md), [hardware preparation](hardware.md), [calibration](calibration.md) and [final acceptance](final-acceptance.md).
