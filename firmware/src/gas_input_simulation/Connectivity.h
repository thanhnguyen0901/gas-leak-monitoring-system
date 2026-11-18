#pragma once
#include <WiFi.h>
#include <atomic>
#include "Config.h"
inline std::atomic<bool> wifiOnline{false};
inline void connectivityTask(void*) {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  uint32_t lastAttempt = millis() - 10000;
  for (;;) {
    const uint32_t now = millis();
    wifiOnline.store(WiFi.status() == WL_CONNECTED);
    if (!wifiOnline.load() && uint32_t(now - lastAttempt) >= 10000) {
      lastAttempt = now;
      WiFi.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}
inline void startConnectivity() {
  if (!Config::WIFI_SSID[0]) return;
  // Any DNS, TLS, or broker waits stay on core 0; the Arduino safety loop runs on core 1.
  if (xTaskCreatePinnedToCore(connectivityTask, "connectivity", 12288, nullptr, 1, nullptr, 0) != pdPASS)
    Serial.println("Connectivity task unavailable; local sensing remains active");
}
