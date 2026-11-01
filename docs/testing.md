# Future testing strategy

This is a planned strategy, not a test-results report. Only prior setup and blink checks supplied by the user are recorded in `../audit.md`.

| Area | Planned verification |
| --- | --- |
| Firmware compilation | Compile for the selected ESP32 board after firmware changes; capture toolchain, board configuration, and output. |
| Wokwi simulation | Reproduce the version-controlled circuit, sweep the simulated analog range, and record inputs and observed outputs. |
| State transitions | Exercise SAFE / WARNING / DANGER, exact threshold boundaries, rising/falling inputs, recovery, and any selected hysteresis. |
| Local safety | Verify LEDs, buzzer patterns, OLED, and relay/fan response for each state and transition. |
| Wi-Fi failures | Start without Wi-Fi, disconnect during operation, and restore it; confirm local sensing and safety continue while retries run. |
| MQTT failures | Make the broker unreachable and interrupt an active connection; verify local safety, reconnect behavior, and documented message handling. |
| Backend | Test telemetry/alert parsing, invalid payloads, persistence interactions, REST responses, and WebSocket delivery. |
| Dashboard | Test realtime updates, chart units, state/fan display, stale or offline data, recovery, and alert history. |
| Notifications | Test WARNING, DANGER, recovery, duplicate events, cooldown boundaries, and Telegram delivery failures without real tokens in evidence. |
| Physical hardware | Confirm wiring, electrical compatibility, sensor warm-up and calibration, OLED, LEDs, buzzer, relay, and DC fan operation. |
| End-to-end | Exercise simulated input → ESP32 → MQTT → backend → database → web → Telegram, then repeat on calibrated hardware. |

## Failure and recovery coverage

Test Wi-Fi, MQTT, backend, database, and Internet unavailability separately. Raise and lower gas input during each outage, verifying sensing, classification, buzzer, LEDs, and fan control continue locally. Restore services and check reconnection, dashboard freshness, and notification behavior against documented rules. Define any buffering, deduplication, or loss expectations before asserting results.

## Evidence and reporting

For each applicable phase, record setup/version, input, expected behavior, actual observation, and outcome under `docs/evidence/<phase>/`. Redact credentials and sensitive identifiers. Record limitations and checks not run; do not invent PASS results. Append verification summaries to `audit.md` and update only completed tasks in `plan.md`.

Documentation-only initialization requires file, consistency, scope, secret, and artifact checks. Firmware builds, simulation runs, and application tests are not applicable until implementation exists.
