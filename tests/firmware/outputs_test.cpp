#include <cassert>
#include <iostream>
#include "../../firmware/src/gas_input_simulation/LocalOutputs.h"
int main() {
 for (uint32_t t=0;t<10000;t+=5) {
  auto s=localOutputs(GasState::SAFE,t); assert(!s.fan); assert(s.green&&!s.yellow&&!s.red&&!s.buzzer);
  auto w=localOutputs(GasState::WARNING,t); assert(w.fan); assert(!w.green&&w.yellow&&!w.red); assert(w.buzzer==(t%2000<150));
  auto d=localOutputs(GasState::DANGER,t); assert(d.fan); assert(!d.green&&!d.yellow&&d.red); assert(d.buzzer==(t%400<200));
 }
 assert(!localOutputs(GasState::SAFE,UINT32_MAX).buzzer);
 std::cout<<"LED mapping and buzzer cadence passed over 10 seconds\n";
}
