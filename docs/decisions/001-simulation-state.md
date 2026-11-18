# Simulation state thresholds and sequencing

2026-11-18: the user authorized sequential implementation of all subsequent phases with a commit per phase and final manual testing. This replaces the earlier Phase 1 stop instruction. Simulation and physical verification remain explicitly pending.

For demonstration only, raw ADC warning entry is 1400 and danger entry is 2800. Recovery is strictly below 1250 and 2650 respectively (150-count hysteresis). A direct jump from danger to safe is allowed below 1250. Invalid input/configuration fails to danger. These are simulated raw counts, not production settings or gas concentration.
