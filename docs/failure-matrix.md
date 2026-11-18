# Failure and recovery matrix

| Failure | Implemented behavior | Evidence / remaining check |
| --- | --- | --- |
| Wi-Fi unavailable | Core-0 reconnect task retries every 10s; core-1 sampling/outputs do not wait | Firmware builds; actual ESP32/Wokwi AP outage remains pending |
| MQTT unavailable | Worker reconnects; latest snapshot plus 16 queued alerts; bounded loss policy | Backend broker shutdown/restart verified; firmware broker outage pending |
| Backend unavailable | Device local outputs continue; QoS0 messages can be lost | Backend shutdown shown offline in browser; ESP32 behavior pending |
| Database unavailable | Health reports degraded/storageAvailable false; bounded processing backlog; failed ingestion counted | Actual isolated PostgreSQL pause/unpause and history recovery verified |
| Old device boot replay | Older sequence and known retired-boot telemetry ignored | Backend integration test verified |
| Telegram unavailable | HTTP timeout, retry/backoff, retry_after, bounded queue and drop count | Mock-delivery tests passed; actual Internet/Telegram outage pending |
| OLED/I2C stalled | Separate core-0 display task with one-frame queue; sensing/outputs do not call I2C | Firmware compile verified; stuck-bus hardware test pending |
| Sensor unplugged | Floating ADC is not reliably detectable with current wiring/software | Physical bias/fault design and testing required |
| Reset/power failure | Firmware starts with relay inactive, then immediate sampling; queues are RAM-only | Reset/brownout, electrical fail-state and retained history checks pending |

Software outage tests use only uniquely named throwaway infrastructure. They do not demonstrate physical safety or Wokwi execution. Database failures may drop messages once attempted; no durable firmware buffer or backend MQTT outbox is promised. See MQTT contract and notification limits.
