#pragma once
#include <Wire.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <Adafruit_SSD1306.h>
#include "GasState.h"
#include "Config.h"
class StatusDisplay {
  Adafruit_SSD1306 screen{128, 64, &Wire, -1};
  bool available = false;
  struct Frame { int raw; GasState state; SensorStatus sensor; };
  QueueHandle_t frames = nullptr;
  static void worker(void* context) { static_cast<StatusDisplay*>(context)->run(); }
  void run() {

    Wire.begin(21, 22);
    Wire.setTimeOut(20);
    available = screen.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    if (available) { screen.setTextColor(SSD1306_WHITE); screen.setTextSize(1); }
    for (;;) { Frame frame; if (xQueueReceive(frames, &frame, portMAX_DELAY)==pdTRUE) draw(frame.raw,frame.state,frame.sensor); }
  }
  void draw(int raw, GasState state,SensorStatus sensor) {
    if (!available) return;
    screen.clearDisplay();
    screen.setCursor(0, 0); screen.println(Config::SIMULATED_INPUT ? "SIMULATED GAS / ADC" : "SENSOR RAW ADC");
    screen.setCursor(0, 18); screen.print("Raw: "); screen.println(raw);
    screen.setCursor(0, 34); screen.println(stateName(state));
    screen.setCursor(0, 50); screen.println(sensor==SensorStatus::OK?"RAW ADC / NOT ppm":sensorStatusName(sensor));
    screen.display();
  }
 public:
  void begin() {
    frames=xQueueCreate(1,sizeof(Frame));
    if (frames && xTaskCreatePinnedToCore(worker,"display",4096,this,2,nullptr,0)!=pdPASS) {
      vQueueDelete(frames);frames=nullptr;
    }
  }
  void update(int raw,GasState state,SensorStatus sensor) { if(frames){const Frame frame{raw,state,sensor};xQueueOverwrite(frames,&frame);} }
};
