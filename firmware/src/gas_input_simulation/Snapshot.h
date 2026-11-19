#pragma once
#include <stdint.h>
#include "GasState.h"
#include "SensorStatus.h"
struct Snapshot {
  int raw=0;
  GasState state=GasState::SAFE, previous=GasState::SAFE;
  bool fan=false;
  uint32_t sequence=0,uptime=0;
  SensorStatus sensorStatus=SensorStatus::OK;
};
struct AlertEnvelope { Snapshot sample{}; char boot[17]{}; };
