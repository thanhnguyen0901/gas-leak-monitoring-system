#pragma once
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "GasState.h"
class StatusDisplay {
  Adafruit_SSD1306 screen{128, 64, &Wire, -1};
  bool available = false;
 public:
  void begin() {
    Wire.begin(21, 22);
    Wire.setTimeOut(20);
    available = screen.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    if (available) { screen.setTextColor(SSD1306_WHITE); screen.setTextSize(1); }
  }
  void update(int raw, GasState state) {
    if (!available) return;
    screen.clearDisplay();
    screen.setCursor(0, 0); screen.println("SIMULATED GAS / ADC");
    screen.setCursor(0, 18); screen.print("Raw: "); screen.println(raw);
    screen.setCursor(0, 34); screen.println(stateName(state));
    screen.setCursor(0, 50); screen.println("NOT CALIBRATED ppm");
    screen.display();
  }
};
