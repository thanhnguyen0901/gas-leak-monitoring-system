#pragma once
#include "GasState.h"
struct LocalOutputs { bool green; bool yellow; bool red; bool buzzer; bool fan; };
inline LocalOutputs localOutputs(GasState state, uint32_t now) {
  return {state == GasState::SAFE, state == GasState::WARNING,
          state == GasState::DANGER,
          state == GasState::DANGER ? now % 400 < 200 :
          state == GasState::WARNING ? now % 2000 < 150 : false, state != GasState::SAFE};
}
