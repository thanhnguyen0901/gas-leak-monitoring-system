# Integrated Wokwi simulation

The circuit now contains ESP32 DevKit V1, potentiometer, green/yellow/red LEDs with 220-ohm resistors, buzzer, SSD1306 and an active-high relay. The relay drives a blue **fan-load indicator**; it does not simulate motor current or airflow.

| Signal | GPIO / connection |
| --- | --- |
| Potentiometer SIG | 34 / ADC1 |
| Potentiometer VCC/GND | 3V3 / GND.1 |
| Green/yellow/red LEDs | 25 / 26 / 27 |
| Buzzer | 32 |
| OLED SDA/SCL | 21 / 22 (0x3C) |
| Relay input | 33, active high NPN |

## Browser workflow

1. Run `python3 scripts/export-wokwi.py`. Import files from ignored `firmware/wokwi/build/project/` into the [ESP32 Arduino template](https://wokwi.com/projects/new/esp32). This bundle contains sketch.ino, all public headers, diagram.json and libraries.txt; config.local.h is intentionally excluded.
2. Start simulation with networking disabled first. Serial uses 115200 baud, readings update every 500ms. Click/rotate the potentiometer; Home/End select endpoints and Left/Right provide fine control.
3. Test low/middle/high and live changes. Wokwi potentiometer attrs.value ranges 0–1023; ESP32 raw ADC counts range 0–4095. Exact mapping may vary. Values are never calibrated ppm.
4. For the integrated test, use a private project/environment and add a local config copied from the current example. Set Wokwi-GUEST/empty password for simulated Wi-Fi and your reachable MQTT TLS broker/CA/credentials. Do not publish credentials in a public Wokwi project. Browser Wokwi cannot reach your computer's localhost broker through the public gateway.
5. Observe state transitions, local outputs, API/dashboard and optional real Telegram. Follow [final acceptance](../../docs/final-acceptance.md) and store actual evidence.

## Local extension workflow

Install libraries per [firmware README](../README.md), configure ignored config.local.h and run scripts/build-firmware.sh from repository root. Open firmware/wokwi as the VS Code workspace with a configured Wokwi extension; run Wokwi: Start Simulator. wokwi.toml references the generated merged binary and ELF relative to this directory.

Simulation-only entry thresholds are WARNING >=1400 and DANGER >=2800. Recovery requires raw <2650 to leave DANGER and <1250 to reach SAFE. WARNING/DANGER enable the relay. Green is SAFE, yellow WARNING, red DANGER; warning beeps 150ms/2s and danger 200ms/400ms at 2kHz.

## Verification limits

ESP32 builds, portable logic tests and software broker/database/API/dashboard tests have been run. Wokwi execution itself, physical motor behavior and live Telegram have not been verified. Historical Phase 1 evidence records the earlier minimal circuit; do not treat it as current integrated runtime evidence.

References: [potentiometer](https://docs.wokwi.com/parts/wokwi-potentiometer), [diagram format](https://docs.wokwi.com/diagram-format), [relay](https://docs.wokwi.com/parts/wokwi-relay-module), [local configuration](https://docs.wokwi.com/vscode/project-config).

The sketch targets Arduino-ESP32 core 3.3.12. Browser source compilation has not been verified against its selected core version. For a toolchain-matched simulation, use the locally compiled merged image/ELF with the extension, or follow the official [custom application firmware workflow](https://docs.wokwi.com/guides/esp32#custom-application-firmware). Treat any configured binary as private because it can contain local connection credentials; never publish it.
