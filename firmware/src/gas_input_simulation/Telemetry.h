#pragma once
#include <Arduino.h>
#include <atomic>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include "Snapshot.h"
inline QueueHandle_t latestReading=nullptr,alertEvents=nullptr;
inline char bootId[17]={};
inline std::atomic<uint32_t> droppedAlerts{0},journalDepth{0};
inline std::atomic<bool> alertJournalHealthy{false};
inline void recordSnapshot(const Snapshot& sample) {
  if(latestReading)xQueueOverwrite(latestReading,&sample);
  if(sample.state!=sample.previous) {
    AlertEnvelope event{};event.sample=sample;memcpy(event.boot,bootId,sizeof(bootId));
    if(!alertEvents||xQueueSend(alertEvents,&event,0)!=pdPASS)droppedAlerts.fetch_add(1);
  }
}
