# Sensor quality and conservative local handling

Firmware reports sensorStatus/previousSensorStatus: OK, WARMING_UP, VERIFYING_SIGNAL, LOW_RAIL, HIGH_RAIL. Existing v1 devices may omit these fields (treated as OK for compatibility). Quality changes create alerts even when the gas state remains DANGER, so sensor readiness does not silently hide a subsequent genuine gas-danger condition.

During configured warm-up, rail verification or latched rail attention, local gas/output state is conservatively DANGER: red warning, danger buzzer and relay enabled. OLED, dashboard and Telegram explicitly label the sensor reason. This is an uncertainty/fault response, not proof of gas concentration. Once quality is OK, ordinary raw gas classification/hysteresis applies.

Defaults: simulation warm-up=0 and rail diagnostics disabled, preserving the low/middle/high potentiometer experiment. Physical mode requires a positive explicitly reviewed SENSOR_WARMUP_MS in addition to calibration confirmation. Set the correct duration for the exact sensor/module/setup; the code does not invent a datasheet warm-up duration. Initial sensor conditioning and runtime warm-up may differ.

Configurable rail bounds default to raw 0 and 4095. Rail input immediately reports VERIFYING_SIGNAL and retains conservative outputs; it must never cause a temporary SAFE during qualification. After continuous rail input for SENSOR_RAIL_FAULT_MS (default 5000ms), that reason is latched. SENSOR_RECOVERY_SAMPLES (default 3) consecutive non-rail samples are required to clear the rail/verification attention. At a 500ms sample period this is 1.5s nominal recovery qualification. Brief rail noise resets the persistence timer. This is raw diagnostic policy, not calibrated gas thresholds.

Floating/disconnected wires can produce plausible intermediate values. Rail diagnosis cannot prove the sensor is connected: review external bias, voltage scaling and faults on the real circuit. High rail may represent sensor saturation/high gas; it continues conservative warnings and ventilation, never suppresses them. Physical relay/ventilation suitability remains a separate electrical acceptance task.

## One final simulation acceptance round

First test default diagnostics-disabled low/middle/high behavior. Then use a private simulation test profile with SENSOR_DIAGNOSTICS_ENABLED=true and an explicitly simulated warm-up (e.g. 3000ms), without treating those timings as hardware calibration. Verify WARMING_UP, hold each rail for at least the configured fault interval, then supply at least three valid consecutive samples. Observe local outputs, quality-only alerts, UI labels and mock/live Telegram as configured.

The NVS journal schema now records previous quality. Its reader migrates the previous journal layout in memory, preserving pending event identity/order; malformed/foreign versions remain unhealthy and are not silently erased. Host migration tests passed; actual flash/power-cut acceptance is pending.
