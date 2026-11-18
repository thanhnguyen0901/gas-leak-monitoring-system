#pragma once
#include <stdint.h>

enum class GasState { SAFE, WARNING, DANGER };
inline const char* stateName(GasState state) {
  switch (state) {
    case GasState::WARNING: return "WARNING";
    case GasState::DANGER: return "DANGER";
    default: return "SAFE";
  }
}

// SIMULATION thresholds in 12-bit raw counts; never calibrated gas ppm.
struct Thresholds {
  int warning = 1400;
  int danger = 2800;
  int hysteresis = 150;
  bool valid() const {
    return warning > hysteresis && danger > warning + hysteresis &&
           danger <= 4095 && hysteresis >= 0;
  }
};
class GasStateEngine {
 public:
  explicit GasStateEngine(Thresholds thresholds = {}) : limits(thresholds) {}
  GasState update(int raw) {
    // Invalid configuration or invalid ADC input fails to DANGER.
    if (!limits.valid() || raw < 0 || raw > 4095) return state = GasState::DANGER;
    if (raw >= limits.danger) return state = GasState::DANGER;
    if (state == GasState::DANGER && raw >= limits.danger - limits.hysteresis) return state;
    if (raw >= limits.warning) return state = GasState::WARNING;
    if (state != GasState::SAFE && raw >= limits.warning - limits.hysteresis)
      return state = GasState::WARNING;
    return state = GasState::SAFE;
  }
 private:
  Thresholds limits;
  GasState state = GasState::SAFE;
};
