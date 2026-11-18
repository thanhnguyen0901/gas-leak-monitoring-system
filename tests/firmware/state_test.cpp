#include <cassert>
#include <iostream>
#include "../../firmware/src/gas_input_simulation/GasState.h"
int main() {
  GasStateEngine e;
  assert(e.update(0) == GasState::SAFE);
  assert(e.update(1399) == GasState::SAFE);
  assert(e.update(1400) == GasState::WARNING);
  assert(e.update(2799) == GasState::WARNING);
  assert(e.update(2800) == GasState::DANGER);
  assert(e.update(4095) == GasState::DANGER);
  assert(e.update(2650) == GasState::DANGER);
  assert(e.update(2649) == GasState::WARNING);
  assert(e.update(1250) == GasState::WARNING);
  assert(e.update(1249) == GasState::SAFE);
  assert(e.update(4095) == GasState::DANGER);
  assert(e.update(0) == GasState::SAFE);
  assert(e.update(-1) == GasState::DANGER);
  assert(e.update(4096) == GasState::DANGER);
  GasStateEngine bad({100, 50, 150});
  assert(bad.update(0) == GasState::DANGER);
  for (int raw=0; raw<=4095; ++raw) {
    GasStateEngine fresh;
    assert(fresh.update(raw) == (raw>=2800 ? GasState::DANGER : raw>=1400 ? GasState::WARNING : GasState::SAFE));
  }
  std::cout << "State boundaries, hysteresis, jumps, invalid input and all 4096 rising inputs passed\n";
}
