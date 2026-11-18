# ESP32 gas monitor firmware

Canonical sketch: `src/gas_input_simulation/gas_input_simulation.ino`, with sibling headers. The folder name is retained for compatibility with Phase 1 and existing Wokwi build paths; it now includes the subsequent local and connectivity features.

- ESP32 DevKit V1, Arduino Framework/core 3.3.12; FQBN esp32:esp32:esp32doit-devkit-v1.
- GPIO34/ADC1, 12-bit raw 0–4095, sampled every 500ms; Serial 115200.
- Simulated thresholds: WARNING 1400, DANGER 2800, 150-count recovery hysteresis. No ppm conversion.
- LEDs GPIO25/26/27; buzzer32; relay33; SSD1306 SDA21/SCL22.
- Core 1 runs sensing/classification/outputs; separate core-0 tasks draw OLED frames and perform optional Wi-Fi/MQTT work. Queue writes from local loop do not wait.

Install dependencies using Arduino Library Manager or `arduino-cli lib install "Adafruit SSD1306@2.5.17" "Adafruit GFX Library@1.13.0" "Adafruit BusIO@1.17.4" "PubSubClient@2.8"`. Then run `scripts/build-firmware.sh` from repository root. Set ARDUINO_CLI or ARDUINO_LIBRARIES_DIR if tools/libraries are not in standard locations. The script falls back to the macOS Arduino IDE bundled CLI. Build output is ignored under firmware/wokwi/build.

Copy config.example.h to ignored config.local.h and configure SSID and broker privately; the default empty SSID keeps networking off. Set broker CA PEM for cloud TLS. For a temporary external config header, set GAS_CONFIG_HEADER to an absolute path without whitespace. Hardware mode requires explicit reviewed calibration confirmation and raw thresholds; see docs/hardware.md and docs/calibration.md.

See [simulation](wokwi/README.md), [MQTT contract](../docs/mqtt-contract.md), [failure matrix](../docs/failure-matrix.md), and [final acceptance](../docs/final-acceptance.md). Builds and host tests exist; actual Wokwi, live cloud/Telegram and hardware acceptance remain pending.
