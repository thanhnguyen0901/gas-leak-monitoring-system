# Phase 13 execution — 2026-11-18

Prepared physical GPIO mapping, configurable raw thresholds/relay polarity and a simulation-vs-hardware mode guard that refuses unconfirmed physical calibration. Payload/display labels reflect the selected profile. Added external config-header support without versioning credentials.

Default ESP32 build passed. A temporary network-enabled simulation profile (Wokwi-GUEST, example.invalid broker, no real credentials) also linked successfully: 1056321 bytes flash, 49644 bytes globals. Host compile tests verify physical mode is rejected unless explicitly confirmed. No hardware was flashed, wired or measured; all physical tasks remain unchecked.

Status: IN PROGRESS. Actual runtime/hardware checks are never inferred from compilation.
