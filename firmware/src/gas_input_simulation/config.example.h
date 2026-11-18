#pragma once
// Copy to ignored config.local.h and edit locally. Empty SSID keeps networking off.
namespace Config {
inline constexpr char WIFI_SSID[] = "";
inline constexpr char WIFI_PASSWORD[] = "";
inline constexpr char DEVICE_ID[] = "esp32-01";
inline constexpr char MQTT_HOST[] = "";
inline constexpr uint16_t MQTT_PORT = 8883;
inline constexpr bool MQTT_TLS = true;
inline constexpr char MQTT_USER[] = "";
inline constexpr char MQTT_PASSWORD[] = "";
// Paste broker CA PEM in config.local.h. Never disable TLS verification for cloud use.
inline constexpr char MQTT_CA[] = "";
}
