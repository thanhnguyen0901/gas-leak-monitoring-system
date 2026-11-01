# Target Architecture - Not Fully Implemented Yet

This document describes the planned system. This repository currently contains documentation and placeholders only.

```text
Gas Sensor
    |
    v
ESP32
 |  |  |  |
 |  |  |  +--> Relay --> Fan
 |  |  +-----> Buzzer / LEDs
 |  +--------> OLED
 |
 +--> Wi-Fi
       |
       v
    MQTT Broker
       |
       v
   NestJS Backend
     |      |
     |      +--> Telegram Notification
     |
     +--> PostgreSQL
     |
     +--> WebSocket / REST
             |
             v
       React Dashboard
```

## Local safety independence

The ESP32 owns sensing, SAFE / WARNING / DANGER classification, local warnings, OLED updates, and relay/fan control. Local safety must continue through Wi-Fi, MQTT, backend, database, dashboard, and Internet failures. Network connection and retry work must be separate from the local safety loop. Telegram cooldowns must not delay local warnings or fan control.

## Planned component responsibilities

- **Sensor input:** simulated analog source in Wokwi first; MQ-2 or MQ-5 on physical hardware after integration and calibration. Label raw ADC and simulated values explicitly.
- **ESP32:** Arduino Framework C/C++ firmware on ESP32 DevKit V1, developed with Arduino IDE 2.x.
- **MQTT broker:** HiveMQ Cloud initially; broker configuration remains replaceable.
- **NestJS backend:** MQTT ingestion, telemetry and alert processing, REST, WebSocket, notification cooldown and recovery handling.
- **PostgreSQL:** devices, gas readings, and alerts; schema details belong to Phase 9.
- **React dashboard:** TypeScript/Vite interface with realtime readings, status, fan state, connectivity, charts, and alert history.
- **Telegram:** remote warning, danger, and recovery notifications through the Bot API.

## Planned MQTT topics

These proposed topics are subject to refinement before Phase 7 implementation:

```text
gas-monitor/device/{deviceId}/telemetry
gas-monitor/device/{deviceId}/alert
gas-monitor/device/{deviceId}/status
```

Telemetry will carry readings and local state; alert messages will describe state events; status will support connectivity visibility. JSON schema, device identity rules, units, publish intervals, QoS, retained messages, Last Will, and reconnect behavior must be defined and verified before MQTT integration. No topic contract or remote command path is implemented here.

## Configuration and calibration boundaries

Connection details and secrets belong in external configuration, with placeholder templates introduced in the relevant phases. Real gas ppm requires calibrated, datasheet-based conversion. Simulated inputs and thresholds establish behavior only, not physical gas accuracy.
