#pragma once
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <PubSubClient.h>
#include <esp_random.h>
#include <atomic>
#include <time.h>
#include "Config.h"
#include "Telemetry.h"
inline std::atomic<bool> wifiOnline{false}, mqttOnline{false};
inline bool validDeviceId() {
  const size_t n = strlen(Config::DEVICE_ID);
  if (n < 1 || n > 64) return false;
  for (size_t i = 0; i < n; ++i)
    if (!isalnum(static_cast<unsigned char>(Config::DEVICE_ID[i])) && Config::DEVICE_ID[i] != '-' && Config::DEVICE_ID[i] != '_') return false;
  return true;
}
inline void connectivityTask(void*) {
  WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true);
  NetworkClient plain;
  NetworkClientSecure secure;
  secure.setCACert(Config::MQTT_CA); secure.setHandshakeTimeout(5);
  PubSubClient mqtt(Config::MQTT_TLS ? static_cast<Client&>(secure) : static_cast<Client&>(plain));
  mqtt.setServer(Config::MQTT_HOST, Config::MQTT_PORT);
  mqtt.setBufferSize(1024); mqtt.setSocketTimeout(2); mqtt.setKeepAlive(15);
  char prefix[100], telemetryTopic[128], alertTopic[128], statusTopic[128];
  snprintf(prefix, sizeof(prefix), "gas-monitor/device/%s", Config::DEVICE_ID);
  snprintf(telemetryTopic, sizeof(telemetryTopic), "%s/telemetry", prefix);
  snprintf(alertTopic, sizeof(alertTopic), "%s/alert", prefix);
  snprintf(statusTopic, sizeof(statusTopic), "%s/status", prefix);
  uint32_t lastWifi = millis()-10000, lastMqtt = millis()-10000, lastPublish = millis()-2000;
  bool clockStarted = false;
  for (;;) {
    const uint32_t now = millis();
    wifiOnline.store(WiFi.status() == WL_CONNECTED);
    if (!wifiOnline.load()) {
      mqttOnline.store(false);
      if (mqtt.connected()) mqtt.disconnect();
      if (uint32_t(now-lastWifi)>=10000) { lastWifi=now; WiFi.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD); }
    } else {
      if (!clockStarted) { configTime(0, 0, "pool.ntp.org", "time.nist.gov"); clockStarted = true; }
      const bool tlsReady = !Config::MQTT_TLS || (Config::MQTT_CA[0] && time(nullptr)>1700000000);
      if (Config::MQTT_HOST[0] && tlsReady && !mqtt.connected() && uint32_t(now-lastMqtt)>=10000) {
        lastMqtt=now;
        if (mqtt.connect(Config::DEVICE_ID, Config::MQTT_USER[0] ? Config::MQTT_USER : nullptr,
                         Config::MQTT_PASSWORD[0] ? Config::MQTT_PASSWORD : nullptr,
                         statusTopic, 1, true, "{\"online\":false}"))
          mqtt.publish(statusTopic, "{\"online\":true}", true);
      }
      mqtt.loop(); mqttOnline.store(mqtt.connected());
      if (mqtt.connected()) {
        Snapshot sample;
        const bool alertPending = alertEvents && xQueuePeek(alertEvents, &sample, 0) == pdTRUE;
        const bool telemetryDue = uint32_t(now-lastPublish)>=2000;
        if (alertPending || (telemetryDue && latestReading && xQueuePeek(latestReading, &sample, 0)==pdTRUE)) {
          char json[512];
          snprintf(json, sizeof(json),
            "{\"version\":1,\"deviceId\":\"%s\",\"bootId\":\"%s\",\"sequence\":%lu,\"uptimeMs\":%lu,\"rawAdc\":%d,\"state\":\"%s\",\"previousState\":\"%s\",\"fanOn\":%s,\"simulated\":true}",
            Config::DEVICE_ID, bootId, static_cast<unsigned long>(sample.sequence), static_cast<unsigned long>(sample.uptime),
            sample.raw, stateName(sample.state), stateName(sample.previous), sample.fan ? "true" : "false");
          if (mqtt.publish(alertPending ? alertTopic : telemetryTopic, json)) {
            if (alertPending) xQueueReceive(alertEvents, &sample, 0);
            else lastPublish=now;
          }
        }
      }
    }
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}
inline void startConnectivity() {
  latestReading=xQueueCreate(1, sizeof(Snapshot));
  alertEvents=xQueueCreate(16, sizeof(Snapshot));
  snprintf(bootId, sizeof(bootId), "%08lx%08lx", static_cast<unsigned long>(esp_random()), static_cast<unsigned long>(esp_random()));
  if (!Config::WIFI_SSID[0]) return;
  if (!validDeviceId()) { Serial.println("Invalid device ID; networking disabled"); return; }
  if (xTaskCreatePinnedToCore(connectivityTask, "connectivity", 12288, nullptr, 1, nullptr, 0)!=pdPASS)
    Serial.println("Connectivity task unavailable; local safety remains active");
}
