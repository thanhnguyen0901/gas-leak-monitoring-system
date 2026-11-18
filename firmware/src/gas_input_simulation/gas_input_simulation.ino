#include <Arduino.h>
#include "GasState.h"
#include "LocalOutputs.h"

constexpr uint8_t GAS_INPUT_PIN = 34;
constexpr uint8_t GREEN_PIN = 25, YELLOW_PIN = 26, RED_PIN = 27, BUZZER_PIN = 32;
constexpr uint32_t SAMPLE_INTERVAL_MS = 500;
GasStateEngine stateEngine;
GasState gasState = GasState::SAFE;
int gasRawAdc = 0;
uint32_t lastSample = 0;
bool sampled = false;

void setup() {
  Serial.begin(115200);
  pinMode(GAS_INPUT_PIN, INPUT);
  analogReadResolution(12);
  for (auto pin : {GREEN_PIN, YELLOW_PIN, RED_PIN}) pinMode(pin, OUTPUT);
  ledcAttach(BUZZER_PIN, 2000, 8);
}

void loop() {
  const uint32_t now = millis();
  if (!sampled || uint32_t(now - lastSample) >= SAMPLE_INTERVAL_MS) {
    sampled = true;
    lastSample = now;
    gasRawAdc = analogRead(GAS_INPUT_PIN);
    gasState = stateEngine.update(gasRawAdc);
    Serial.printf("Gas raw ADC: %d State: %s\n", gasRawAdc, stateName(gasState));
  }
  const auto out = localOutputs(gasState, now);
  digitalWrite(GREEN_PIN, out.green);
  digitalWrite(YELLOW_PIN, out.yellow);
  digitalWrite(RED_PIN, out.red);
  ledcWriteTone(BUZZER_PIN, out.buzzer ? 2000 : 0);
  delay(5);  // Yield only; sampling and warning patterns use millis().
}
