#include <Arduino.h>
#include "GasState.h"
#include "LocalOutputs.h"
#include "Display.h"
#include "Connectivity.h"
StatusDisplay display;

constexpr uint8_t GAS_INPUT_PIN = 34;
constexpr uint8_t GREEN_PIN = 25, YELLOW_PIN = 26, RED_PIN = 27, BUZZER_PIN = 32;
constexpr uint8_t RELAY_PIN = 33;
constexpr bool RELAY_ACTIVE_LOW = Config::RELAY_ACTIVE_LOW; // Wokwi NPN relay; verify actual module polarity.
constexpr uint32_t SAMPLE_INTERVAL_MS = 500;
GasStateEngine stateEngine({Config::WARNING_ADC, Config::DANGER_ADC, Config::HYSTERESIS_ADC});
GasState gasState = GasState::SAFE;
int gasRawAdc = 0;
uint32_t lastSample = 0;
bool sampled = false;
uint32_t sequence = 0;

void setup() {
  Serial.begin(115200);
  pinMode(GAS_INPUT_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(GAS_INPUT_PIN, ADC_11db);
  for (auto pin : {GREEN_PIN, YELLOW_PIN, RED_PIN}) pinMode(pin, OUTPUT);
  ledcAttach(BUZZER_PIN, 2000, 8);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  display.begin();
  startConnectivity();
}

void loop() {
  const uint32_t now = millis();
  if (!sampled || uint32_t(now - lastSample) >= SAMPLE_INTERVAL_MS) {
    sampled = true;
    lastSample = now;
    gasRawAdc = analogRead(GAS_INPUT_PIN);
    const auto previousState = gasState;
    gasState = stateEngine.update(gasRawAdc);
    recordSnapshot({gasRawAdc, gasState, previousState, gasState != GasState::SAFE, ++sequence, now});
    Serial.printf("Gas raw ADC: %d State: %s\n", gasRawAdc, stateName(gasState));
    display.update(gasRawAdc, gasState);
  }
  const auto out = localOutputs(gasState, now);
  digitalWrite(GREEN_PIN, out.green);
  digitalWrite(YELLOW_PIN, out.yellow);
  digitalWrite(RED_PIN, out.red);
  ledcWriteTone(BUZZER_PIN, out.buzzer ? 2000 : 0);
  digitalWrite(RELAY_PIN, (out.fan != RELAY_ACTIVE_LOW) ? HIGH : LOW);
  delay(5);  // Yield only; sampling and warning patterns use millis().
}
