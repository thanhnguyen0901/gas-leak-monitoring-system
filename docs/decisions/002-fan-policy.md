# Local fan control policy

WARNING and DANGER enable ventilation; SAFE disables it using the state engine recovery hysteresis. GPIO33 drives an active-high NPN Wokwi relay. Startup defaults off until the first reading, which is taken immediately. Verify the physical module polarity before use.

Wokwi uses a blue LED with resistor on relay COM/NO as a **fan load indicator**, not a DC motor model. Actual motor current, inductive transients, power supply, contact ratings and airflow cannot be validated by this simulation. The physical fan requires its own rated supply and suitable suppression. ESP32 pins never power a motor directly.
