# Connectivity isolation

The Arduino loop (ESP32 core 1) owns sampling, state, LEDs, buzzer and relay. A lower-priority FreeRTOS task on core 0 owns Wi-Fi and later MQTT. No local output waits for a network call. Empty SSID leaves networking disabled. Reconnect attempts are spaced 10 seconds apart with a 100 ms worker yield. Task creation failure leaves local safety running. This architecture still requires physical outage testing; task separation alone is not test evidence.

Copy `config.example.h` to ignored `config.local.h`. Use `Wokwi-GUEST` and an empty password only in the public Wokwi simulation. Do not put real credentials in versioned files.
