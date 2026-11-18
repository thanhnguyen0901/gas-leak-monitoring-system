# Target Architecture - Not Fully Implemented Yet

Software components are implemented; full simulation and calibrated physical acceptance are pending. This title describes the complete hardware-plus-service target, not an assertion that only placeholders exist.

```text
Gas Sensor (potentiometer for Wokwi)
    |
    v
ESP32 core 1: sample → state engine → LEDs / buzzer / relay → fan
    |                      |
    |                      +→ one-frame queue → OLED task (core 0)
    +→ latest snapshot + 16-event queue → Wi-Fi / MQTT task (core 0)
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

Default simulation thresholds are 1400/2800 with 150-count hysteresis. Physical mode requires explicit calibration confirmation and valid raw thresholds. Floating sensor inputs, reset/brownout behavior and fan electrical operation still need physical review; compilation cannot validate those properties.

## MQTT and remote services

Implemented v1 topics:

```text
gas-monitor/device/{deviceId}/telemetry
gas-monitor/device/{deviceId}/alert
gas-monitor/device/{deviceId}/status
```

See [payload/QoS contract](mqtt-contract.md). The broker is configurable; HiveMQ Cloud can use TLS/8883 with CA validation. Default empty SSID keeps networking disabled. Reconnect runs on core 0. No remote actuator-command topic is implemented.

NestJS validates topic identity and payloads, serializes bounded ingestion, drops duplicate/older readings, persists history when DATABASE_URL is configured, broadcasts Socket.IO updates and exposes read-only REST. Latest readings expire as online data after a configurable stale interval. PostgreSQL transactions and unique identifiers prevent duplicate stored events. Memory mode is explicitly temporary.

The Telegram worker processes warning/danger/recovery independently from ingestion, with cooldown and bounded retries. Notification queue and cooldown state are RAM-only. The browser receives raw counts and server receipt times, never a calibrated ppm estimate.

## Implementation limits

The Wokwi blue LED represents the relay's fan load only. There is no durable offline firmware history, guaranteed QoS0 delivery, durable notification outbox, ppm conversion, reliable floating-sensor detection or certified physical safety claim. Review [failure matrix](failure-matrix.md), [hardware preparation](hardware.md), [calibration](calibration.md) and [final acceptance](final-acceptance.md).
