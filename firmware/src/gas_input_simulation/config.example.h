#pragma once
// Copy to ignored config.local.h and edit locally. Empty SSID keeps networking off.
namespace Config {
inline constexpr bool SIMULATED_INPUT = true;
inline constexpr bool CALIBRATION_CONFIRMED = false;
// Demonstration raw thresholds only; replace after measured hardware calibration.
inline constexpr int WARNING_ADC = 1400, DANGER_ADC = 2800, HYSTERESIS_ADC = 150;
inline constexpr bool RELAY_ACTIVE_LOW = false;
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
