# Reliability hardening — 2026-11-19

Implementation follows the H1–H4 section in plan.md. No actual sensor, flash power-cut, Wokwi, HiveMQ credential or live Telegram result is inferred.

## Actual evidence

- `final-suite.txt`: portable C++ state/output/sensor/journal tests, hardware/warm-up config guards, Python calibration tests, backend/frontend tests/build, real PostgreSQL storage and software/outbox/restart/outage tests.
- `restart-outbox-tests.txt`: transactional jobs/cooldown/recovery survive worker recreation; duplicate alert and concurrent worker tests use real PostgreSQL.
- `ack-integration-tests.txt`, `ack-outage-tests.txt`: actual local broker ACK, duplicate retry, failed DB writes receive no ACK and recovery stores once.
- `sensor-tests.txt`, `journal-migration-tests.txt`, `config-guard-h3.txt`: host logic only, not physical voltage or flash tests.
- `firmware-final.txt`, `firmware-network-final.txt`: current default and isolated network/diagnostics-enabled simulation profile builds. Profile uses Wokwi-GUEST and example.invalid with no real credentials and is never executed on hardware.
- `frontend-h4.txt`: production split chunks; `frontend-tests-h4.txt`: data/offline/quality/service warning tests.
- `compose-smoke-final.txt`: full isolated image build/startup, PostgreSQL, broker, backend MQTT persistence and frontend HTTP. Test cleanup affects only its unique project. Initial Alpine native-bundler failure is retained in `compose-smoke-initial.txt`; Debian builder passed afterward.
- `dashboard-*.png`, `browser-*-check.txt`: actual browser QA on desktop and 390px mobile using explicitly synthetic quality/queue fixture. Values such as pending=5/dropped=2/journal-unhealthy are injected QA scenarios, not measurements of a real ESP32. Table scroll remains inside its panel. Backend shutdown makes health unknown and device data explicitly historical/offline.
- Native backend `npm run dev` startup was exercised with isolated local settings and source-watching DI tokens; no live service credentials were used.

## Remaining acceptance

Use docs/final-acceptance.md for one manual round covering actual Wokwi, cloud TLS/bot delivery, wiring, warm-up/calibration, NVS power cuts/flash-full behavior and fan/relay electrical operation. RAM ingress before NVS commit is volatile; capacity is finite. Telegram send/SQL commit cannot guarantee exactly-once delivery. Floating ADC signals require circuit-level review.
