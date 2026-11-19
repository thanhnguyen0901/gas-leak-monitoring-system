# Final acceptance checklist — not yet executed by the user

User requested a single final manual acceptance round after sequential implementation. Record actual results and environment under the relevant phase evidence folders, then append `audit.md` and reconcile `plan.md`. Do not infer hardware PASS from host tests.

## Preparation

- [ ] Run `npm ci` in backend and frontend; install Arduino libraries listed in firmware/wokwi/libraries.txt.
- [ ] Run `scripts/verify.sh` (set RUN_DOCKER_TESTS=1 and RUN_FIRMWARE_BUILD=1 for applicable checks).
- [ ] Build/start the local stack using docs/integration.md. Isolated Docker build/startup/MQTT/DB/HTTP checks passed on 2026-11-19; confirm your own local configuration.
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

## Consolidated hardening checks — same final acceptance session

- [ ] Use the latest config.example.h as the basis of local config; older private headers may need the new warm-up/diagnostic fields. Apply migrations including 002_notifications before enabling durable notifications.
- [ ] Confirm service-health panels identify PostgreSQL versus memory mode, broker connection and queued/failed notifications. Stop the backend and confirm cached health/data is labeled unknown/offline.
- [ ] For a simulated diagnostic profile only, enable rail diagnostics and choose a clearly simulated warm-up (e.g. 3000ms). Observe WARMING_UP and conservative outputs; rail entry must immediately show VERIFYING_SIGNAL without an intermediate SAFE, then hold each rail longer than the fault duration and require the configured consecutive-good recovery samples. Do not reuse simulation timing as a physical datasheet value.
- [ ] Confirm sensor-quality changes generate alerts even if gas state remains DANGER, and later trusted gas danger is explicitly notified. A floating intermediate ADC is not reliably diagnosed; check the actual bias/fault circuit separately.
- [ ] Trigger an unsafe notification, restart the backend, then return to SAFE. Verify durable cooldown/incident state and recovery. Also verify recovery after unsafe delivery retries fail; inspect failed jobs in health/history.
- [ ] Stop the DB, trigger an alert, and observe pending firmware events remain without application ACK. Restore DB and verify one stored event/outbox job despite retries and a subsequent ACK clearing the journal.
- [ ] With events confirmed journaled and broker unavailable, reboot the ESP32 and restore services. Verify old-boot event identities are preserved, stored once and acknowledged. Confirm ordinary samples remain current rather than old telemetry being replayed.
- [ ] Review finite 32 NVS + 16 RAM capacity, overflow counters, NVS failure indication, the volatile ingress window and the external Telegram send/SQL-commit duplicate window. Physical power-cut/flash-full tests require controlled bench conditions and real evidence.

Automated host/container tests already exercise logic, SQL persistence, duplicate ACKs, restart and outage paths. These remaining checks validate your exact Wokwi/cloud/board/sensor/electrical setup; they are not marked PASS in advance.
