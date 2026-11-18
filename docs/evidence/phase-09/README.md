# Phase 9 execution — 2026-11-18

Added transactional PostgreSQL persistence for devices, gas_readings and alerts, versioned/idempotent SQL migration, uniqueness/ADC/state constraints and historical REST queries. Added an isolated throwaway-container DB test runner. Empty DATABASE_URL remains explicitly ephemeral memory mode.

Real PostgreSQL 16 Docker tests passed: migrations, repeat application, duplicate suppression, invalid ADC rollback and persistence across storage reconnect. MQTT/API/WebSocket regression tests passed. Temporary test container removed.

Status: COMPLETED. Actual runtime/hardware checks are never inferred from compilation.
