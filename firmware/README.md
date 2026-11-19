# ESP32 gas monitor firmware

Canonical sketch: `src/gas_input_simulation/gas_input_simulation.ino`, with sibling headers, including SensorHealth and AlertJournal. The folder name is retained for compatibility with Phase 1 and existing Wokwi build paths; it now includes the subsequent local and connectivity features.

- ESP32 DevKit V1, Arduino Framework/core 3.3.12; FQBN esp32:esp32:esp32doit-devkit-v1.
- GPIO34/ADC1, 12-bit raw 0–4095, sampled every 500ms; Serial 115200.
- Simulated thresholds: WARNING 1400, DANGER 2800, 150-count recovery hysteresis. No ppm conversion.
- LEDs GPIO25/26/27; buzzer32; relay33; SSD1306 SDA21/SCL22.
- Core 1 runs sensing/classification/outputs; separate core-0 tasks draw OLED frames and perform optional Wi-Fi/MQTT work. Queue writes from local loop do not wait.

Install dependencies using Arduino Library Manager or `arduino-cli lib install "Adafruit SSD1306@2.5.17" "Adafruit GFX Library@1.13.0" "Adafruit BusIO@1.17.4" "PubSubClient@2.8"`. Then run `scripts/build-firmware.sh` from repository root. Set ARDUINO_CLI or ARDUINO_LIBRARIES_DIR if tools/libraries are not in standard locations. The script falls back to the macOS Arduino IDE bundled CLI. Build output is ignored under firmware/wokwi/build; set GAS_OUTPUT_DIR for an isolated profile output.

Copy config.example.h to ignored config.local.h and configure SSID and broker privately; the default empty SSID keeps networking off. Set broker CA PEM for cloud TLS. For a temporary external config header, set GAS_CONFIG_HEADER to an absolute path without whitespace. Hardware mode requires explicit reviewed calibration confirmation and raw thresholds; see docs/hardware.md and docs/calibration.md.

See [simulation](wokwi/README.md), [MQTT contract](../docs/mqtt-contract.md), [failure matrix](../docs/failure-matrix.md), and [final acceptance](../docs/final-acceptance.md). Builds and host tests exist; actual Wokwi, live cloud/Telegram and hardware acceptance remain pending.

Reliability additions: warm-up/rail quality with conservative outputs; quality-only alert events; 32-entry checksummed Preferences/NVS transition journal plus 16 RAM ingress slots; retry until application ACK; pending/dropped/journal-health diagnostics. Flash writes stay in the core-0 worker and retry storage failures with backoff. A pre-NVS power cut can still lose ingress events, and capacity is finite. Physical mode requires explicit warm-up as well as calibration. See docs/sensor-health.md and docs/mqtt-contract.md.
