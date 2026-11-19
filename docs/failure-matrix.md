# Failure and recovery matrix

| Failure | Implemented behavior | Evidence / remaining check |
| --- | --- | --- |
| Wi-Fi unavailable | Core-0 reconnect task retries every 10s; core-1 sampling/outputs do not wait | Firmware builds; actual ESP32/Wokwi AP outage remains pending |
| MQTT unavailable | Worker reconnects; latest snapshot plus 32 NVS/16 RAM transition slots; retries until application ACK | Backend broker shutdown/restart verified; firmware broker outage pending |
| Backend unavailable | Device local outputs continue; QoS0 messages can be lost | Backend shutdown shown offline in browser; ESP32 behavior pending |
| Database unavailable | Health reports degraded/storageAvailable false; bounded processing backlog; failed processing counted separately from invalid payloads; failed alerts remain unacknowledged for device retry | Actual isolated PostgreSQL pause/unpause and history recovery verified |
| Old device boot replay | Older sequence and known retired-boot telemetry ignored | Backend integration test verified |
| Telegram unavailable | HTTP timeout, retry/backoff, retry_after, bounded queue and drop count | Mock delivery and real PostgreSQL outbox/restart tests passed; live Telegram pending |
| OLED/I2C stalled | Separate core-0 display task with one-frame queue; sensing/outputs do not call I2C | Firmware compile verified; stuck-bus hardware test pending |
| Sensor unplugged | Warm-up and sustained rail attention produce explicit fail-safe status; a floating intermediate ADC is still not reliably detectable | Physical bias/fault design and testing required |
| Reset/power failure | Firmware starts with relay inactive, then immediate sampling; journaled transitions survive ordinary reboot; pre-commit ingress is volatile | Reset/brownout, electrical fail-state and retained history checks pending |

Software outage tests use only uniquely named throwaway infrastructure. They do not demonstrate physical safety or Wokwi execution. Failed alert writes receive no ACK and can be retried from the bounded journal; periodic telemetry can still be lost. Notification jobs/state persist in PostgreSQL, but an external send/commit crash can duplicate a Telegram message. Flash integrity, finite capacity and pre-journal ingress windows remain acceptance concerns. See MQTT contract and notification limits.
