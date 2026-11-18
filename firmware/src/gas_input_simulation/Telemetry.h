#pragma once
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include "GasState.h"
struct Snapshot {
  int raw;
  GasState state, previous;
  bool fan;
  uint32_t sequence, uptime;
};
inline QueueHandle_t latestReading = nullptr, alertEvents = nullptr;
inline char bootId[17] = {};
inline void recordSnapshot(const Snapshot& sample) {
  if (latestReading) xQueueOverwrite(latestReading, &sample);
  if (alertEvents && sample.state != sample.previous && xQueueSend(alertEvents, &sample, 0) != pdPASS)
    Serial.println("Alert buffer full; local safety unaffected, oldest queued events retained");
}
