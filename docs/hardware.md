# Physical ESP32 integration — prepared, not verified

| Function | ESP32 GPIO / wiring |
| --- | --- |
| MQ-2 or MQ-5 analog signal | GPIO34 / ADC1 through verified input scaling |
| Green / yellow / red | GPIO25 / 26 / 27, each with series resistor |
| Buzzer | GPIO32; use a driver if the part exceeds GPIO current ratings |
| SSD1306 | SDA21, SCL22, 3.3V-compatible module, address 0x3C |
| Relay control | GPIO33; confirm actual active-high/active-low polarity |
| DC fan power | Separate rated supply through suitable relay COM/NO; never a GPIO power load |

MQ modules commonly require a 5V heater supply and may output above ESP32 input limits. Measure actual AO range and design/verify a divider or buffer so the ESP32 input never exceeds its ratings; do not connect a 5V AO directly. Common ground and supply capacity must be reviewed. Verify relay input voltage compatibility, contact ratings, motor suppression and power-up behavior. The simulated blue fan-load LED is not a motor model or wiring proof.

Copy config.example.h to ignored config.local.h. Set SIMULATED_INPUT=false only after actual wiring checks and calibration; CALIBRATION_CONFIRMED must be explicitly true or compilation refuses physical mode. Replace all demo raw thresholds and confirm relay polarity. Labels remain raw ADC, never ppm. Review the selected MQ manufacturer's datasheet for heater, warm-up, sensing and calibration conditions.

Build with scripts/build-firmware.sh, then upload the compiled sketch through Arduino IDE to the correct physical board/port. No upload or physical hardware operation has been performed by this task. Verify the loaded firmware version, polarity, startup outputs, ADC range, OLED and fan response before final acceptance. This university prototype is not a certified gas safety device.

GPIO34 is input-only and has no internal pull resistor suitable for detecting an unplugged sensor; an open/floating signal is not reliably detected by this software. Review external bias and fault monitoring before physical acceptance. Relay reset/brownout behavior also needs appropriate external bias and measurement.

References: [ESP32 datasheet](https://documentation.espressif.com/esp32_datasheet_en.html), [Winsen MQ-2 manual](https://www.winsen-sensor.com/d/files/manual/mq-2.pdf). Use the datasheet of the exact selected sensor/module, not an assumed warm-up duration.

Physical builds also require a positive explicitly reviewed SENSOR_WARMUP_MS. SENSOR_DIAGNOSTICS_ENABLED defaults on for physical mode; configure and review the rail bounds/duration/recovery count using sensor-health.md. Test warm-up and rail fail-safe outputs on a bench before interpreting gas state. NVS transition persistence/ACK retry is implemented; actual power-cut recovery, flash wear/storage-full behavior and reset electrical outputs still require physical evidence.
