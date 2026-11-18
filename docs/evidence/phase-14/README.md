# Phase 14 execution — 2026-11-18

Added raw ADC reference-data analysis utility, overlap/range/provenance validation, candidate thresholds for review only, hardware calibration procedure and compile-time threshold validation. No ppm conversion or automatic calibration approval is implemented.

Two Python tests using explicitly synthetic fixtures passed, hardware-mode guard tests passed and ESP32 compilation succeeded. Real reference measurements, approved hardware thresholds and calibration evidence do not exist yet; those phase tasks remain unchecked.

Status: IN PROGRESS. Actual runtime/hardware checks are never inferred from compilation.
