# Final acceptance checklist — not yet executed by the user

User requested a single final manual acceptance round after sequential implementation. Record actual results and environment under the relevant phase evidence folders, then append `audit.md` and reconcile `plan.md`. Do not infer hardware PASS from host tests.

## Preparation

- [ ] Run `npm ci` in backend and frontend; install Arduino libraries listed in firmware/wokwi/libraries.txt.
- [ ] Run `scripts/verify.sh` (set RUN_DOCKER_TESTS=1 and RUN_FIRMWARE_BUILD=1 for applicable checks).
- [ ] Build/start the local stack using docs/integration.md. Docker image build/startup remains unverified in this environment because base-image metadata retrieval stalled.
- [ ] Configure the same reachable MQTT broker in backend and firmware privately. For cloud use TLS and CA; do not publish config.local.h or credentials in a public Wokwi project.
- [ ] Configure a real Telegram bot/chat server-side and explicitly enable notifications.

## Wokwi / Phase 1–7 and 12

- [ ] Export with `python3 scripts/export-wokwi.py`; import the credential-free source bundle into Wokwi and configure networking privately. Or build the canonical sketch and run firmware/wokwi/wokwi.toml locally with the configured extension.
- [ ] Observe at least 3 consecutive raw readings at low/middle/high input and live knob response. Serial must use 115200 baud; values are ADC counts only.
- [ ] Observe SAFE below warning entry, WARNING at raw 1400, DANGER at raw 2800. From DANGER, retain it at 2650 and exit below it; retain WARNING at 1250 and recover below it. Use actual Serial ADC values rather than assuming knob position maps exactly.
- [ ] Verify green/yellow/red mapping, warning and danger buzzer cadence, OLED data and relay-driven blue fan-load indicator.
- [ ] Verify device, raw level, fan state, realtime chart and alert/recovery history in dashboard. Actual motor behavior is outside Wokwi's LED load representation.
- [ ] Verify real Telegram WARNING, DANGER and recovery plus cooldown/duplicate behavior.

## Failure and recovery / Phase 15

- [ ] Start without Wi-Fi, then restore it; vary analog input throughout. Observe local sensing, classification, LEDs, buzzer and relay continue.
- [ ] Repeat with wrong/unavailable broker, backend stopped, database stopped and Internet unavailable. Restore each service and check reconnect and fresh/offline dashboard behavior.
- [ ] Inspect bounded event queue overflow/loss behavior; do not expect durable offline telemetry.
- [ ] Disconnect OLED or simulate a stuck bus and confirm local outputs remain responsive.
- [ ] Review sensor disconnection and reset/brownout limitations; verify external bias and electrical fail-state.

## Physical hardware and calibration / Phase 13–14

- [ ] Verify supply/current budgets, AO scaling into GPIO34, relay polarity/rating, fan suppression and external default-state bias.
- [ ] Deploy to the actual ESP32 only after wiring review; record the firmware commit and component identifiers.
- [ ] Complete datasheet-specific sensor warm-up and controlled reference measurements; analyze and review raw thresholds per docs/calibration.md.
- [ ] Confirm physical configuration explicitly only after reviewed calibration. No ppm conversion is provided.
- [ ] Verify actual LEDs, buzzer, OLED, relay, DC fan airflow and state recovery on hardware.

## Final hardware path and report / Phase 16–17

- [ ] Validate sensor → ESP32 → MQTT → backend → PostgreSQL → web → real Telegram on calibrated hardware.
- [ ] Verify database history survives backend restart, alert IDs remain deduplicated and the UI never presents stale data as current online status.
- [ ] Record observed results, defects and limitations; update final report with real screenshots/measurements and complete only verified phase criteria.
