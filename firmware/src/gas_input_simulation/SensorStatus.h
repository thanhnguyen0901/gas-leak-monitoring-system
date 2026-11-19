#pragma once
#include <stdint.h>
enum class SensorStatus : uint8_t { OK, WARMING_UP, LOW_RAIL, HIGH_RAIL };
inline const char* sensorStatusName(SensorStatus status) {
  switch(status) {
    case SensorStatus::WARMING_UP:return "WARMING_UP";
    case SensorStatus::LOW_RAIL:return "LOW_RAIL";
    case SensorStatus::HIGH_RAIL:return "HIGH_RAIL";
    default:return "OK";
  }
}
