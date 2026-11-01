# ESP32 firmware

Phase 1 implements simulated analog gas input and labeled Serial output only. Local safety and networking features are reserved for later requested phases.

The canonical Arduino sketch is [`src/gas_input_simulation/gas_input_simulation.ino`](src/gas_input_simulation/gas_input_simulation.ino). The enclosing folder matches the sketch name so Arduino IDE 2.x and Arduino CLI can compile it directly. No external libraries are required.

- Board: ESP32 DevKit V1; Arduino CLI FQBN `esp32:esp32:esp32doit-devkit-v1`.
- Input: GPIO 34 (ADC1), connected to a simulated potentiometer signal.
- Resolution: explicitly 12 bits; raw ADC range 0–4095.
- Serial: 115200 baud, `Gas raw ADC: <value>` every 500 ms.
- Values are simulated/raw counts, not calibrated gas concentration or ppm. No gas thresholds are defined.

Open the sketch in Arduino IDE 2.x, select DOIT ESP32 DEVKIT V1, and Verify. Alternatively, from repository root:

```sh
arduino-cli compile --fqbn esp32:esp32:esp32doit-devkit-v1 \
  --build-path /private/tmp/gas-leak-phase01-build \
  --output-dir firmware/wokwi/build firmware/src/gas_input_simulation
```

On this macOS setup the bundled CLI is at `/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli`; quote that executable path if `arduino-cli` is not on PATH. Build products are ignored and must not be committed.

See [Wokwi instructions](wokwi/README.md) and [Phase 1 verification](../docs/evidence/phase-01/README.md). `delay(500)` is sufficient for this standalone sampling phase; revisit scheduling before adding other responsibilities.
