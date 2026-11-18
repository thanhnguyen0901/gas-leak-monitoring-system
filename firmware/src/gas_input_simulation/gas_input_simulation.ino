#include <Arduino.h>
#include "GasState.h"

GasStateEngine stateEngine;

// Simulated gas signal only: raw ADC counts, not calibrated concentration.
constexpr uint8_t GAS_INPUT_PIN = 34;
constexpr uint8_t ADC_RESOLUTION_BITS = 12;
constexpr unsigned long SAMPLE_INTERVAL_MS = 500;

void setup() {
  Serial.begin(115200);
  pinMode(GAS_INPUT_PIN, INPUT);
  analogReadResolution(ADC_RESOLUTION_BITS);
}

void loop() {
  const int gasRawAdc = analogRead(GAS_INPUT_PIN);
  Serial.print("Gas raw ADC: ");
  Serial.print(gasRawAdc);
  Serial.print(" State: ");
  Serial.println(stateName(stateEngine.update(gasRawAdc)));
  delay(SAMPLE_INTERVAL_MS);
}
