#pragma once
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <esp_random.h>
#include <atomic>
#include <time.h>
#include "Config.h"
#include "Telemetry.h"
#include "AlertJournal.h"
inline std::atomic<bool> wifiOnline{false},mqttOnline{false};
inline bool validDeviceId() {
  const size_t n=strlen(Config::DEVICE_ID);if(n<1||n>64)return false;
  for(size_t i=0;i<n;i++)if(!isalnum(static_cast<unsigned char>(Config::DEVICE_ID[i]))&&Config::DEVICE_ID[i]!='-'&&Config::DEVICE_ID[i]!='_')return false;
  return true;
}
inline void connectivityTask(void*) {
  AlertJournal journal;
  Preferences preferences;
  bool persistent=preferences.begin("gas-alerts",false);
  if(persistent) {
    const String owner=preferences.getString("device","");
    if(owner.length()&&owner!=Config::DEVICE_ID) {
      // Never replay one device's journal under a different identity.
      persistent=false;preferences.end();
    } else {
      if(!owner.length())persistent=preferences.putString("device",Config::DEVICE_ID)>0;
      const size_t bytes=preferences.getBytesLength("events");
      if(bytes) {
        uint8_t image[AlertJournal::MAX_IMAGE_SIZE];
        persistent=bytes<=sizeof(image)&&preferences.getBytes("events",image,bytes)==bytes&&journal.restore(image,bytes);
      }
      droppedAlerts.fetch_add(preferences.getUInt("dropped",0));
      if(!persistent)preferences.end();
    }
  }
  alertJournalHealthy.store(persistent);
  if(!persistent)Serial.println("Alert journal unavailable/corrupt/identity mismatch; RAM fallback, local safety active");
  auto persist=[&](const AlertJournal& candidate) {
    if(!persistent)return true;
    const bool ok=preferences.putBytes("events",&candidate.data(),sizeof(AlertJournal::Image))==sizeof(AlertJournal::Image);
    alertJournalHealthy.store(ok);return ok;
  };
  const bool networkEnabled=Config::WIFI_SSID[0];
  if(networkEnabled){WiFi.mode(WIFI_STA);WiFi.setAutoReconnect(true);}
  NetworkClient plain;NetworkClientSecure secure;
  secure.setCACert(Config::MQTT_CA);secure.setHandshakeTimeout(5);
  PubSubClient mqtt(Config::MQTT_TLS?static_cast<Client&>(secure):static_cast<Client&>(plain));
  mqtt.setServer(Config::MQTT_HOST,Config::MQTT_PORT);mqtt.setBufferSize(1024);mqtt.setSocketTimeout(2);mqtt.setKeepAlive(15);
  char prefix[100],telemetryTopic[128],alertTopic[128],statusTopic[128],ackTopic[128],expectedAck[64]={};
  snprintf(prefix,sizeof(prefix),"gas-monitor/device/%s",Config::DEVICE_ID);
  snprintf(telemetryTopic,sizeof(telemetryTopic),"%s/telemetry",prefix);
  snprintf(alertTopic,sizeof(alertTopic),"%s/alert",prefix);
  snprintf(statusTopic,sizeof(statusTopic),"%s/status",prefix);
  snprintf(ackTopic,sizeof(ackTopic),"%s/ack",prefix);
  bool ackReceived=false,awaitingAck=false,clockStarted=false,ackStoreFailed=false;
  uint32_t lastAckStoreAttempt=millis()-1000;
  mqtt.setCallback([&](char* topic,uint8_t* payload,unsigned int length){
    if(awaitingAck&&strcmp(topic,ackTopic)==0&&length==strlen(expectedAck)&&memcmp(payload,expectedAck,length)==0)ackReceived=true;
  });
  uint32_t lastWifi=millis()-10000,lastMqtt=millis()-10000,lastTelemetry=millis()-2000,lastAlert=millis()-3000,lastStore=millis()-1000,lastDropCount=droppedAlerts.load();
  auto publish=[&](const char* topic,const Snapshot& sample,const char* boot) {
    char json[600];
    snprintf(json,sizeof(json),
      "{\"version\":1,\"deviceId\":\"%s\",\"bootId\":\"%s\",\"sequence\":%lu,\"uptimeMs\":%lu,\"rawAdc\":%d,\"state\":\"%s\",\"previousState\":\"%s\",\"fanOn\":%s,\"simulated\":%s,\"droppedAlerts\":%lu,\"pendingAlerts\":%lu,\"alertJournalHealthy\":%s,\"sensorStatus\":\"%s\",\"previousSensorStatus\":\"%s\"}",
      Config::DEVICE_ID,boot,static_cast<unsigned long>(sample.sequence),static_cast<unsigned long>(sample.uptime),sample.raw,
      stateName(sample.state),stateName(sample.previous),sample.fan?"true":"false",Config::SIMULATED_INPUT?"true":"false",
      static_cast<unsigned long>(droppedAlerts.load()),static_cast<unsigned long>(journal.size()+(alertEvents?uxQueueMessagesWaiting(alertEvents):0)),alertJournalHealthy.load()?"true":"false",sensorStatusName(sample.sensorStatus),sensorStatusName(sample.previousSensorStatus));
    return mqtt.publish(topic,json);
  };
  for(;;) {
    const uint32_t now=millis();
    // NVS writes belong to this worker, never the local safety loop.
    if(uint32_t(now-lastStore)>=1000) {
      lastStore=now;
      for(unsigned i=0;i<16&&journal.size()<AlertJournal::CAPACITY;i++) {
        AlertEnvelope event;
        if(!alertEvents||xQueuePeek(alertEvents,&event,0)!=pdTRUE)break;
        AlertJournal candidate=journal;
        if(!candidate.push(event)||!persist(candidate))break;
        journal=candidate;xQueueReceive(alertEvents,&event,0);
      }
      if(persistent&&droppedAlerts.load()!=lastDropCount) {
        const auto count=droppedAlerts.load();
        if(preferences.putUInt("dropped",count)==sizeof(uint32_t))lastDropCount=count;
        else alertJournalHealthy.store(false);
      }
    }
    wifiOnline.store(networkEnabled&&WiFi.status()==WL_CONNECTED);
    if(!wifiOnline.load()) {
      mqttOnline.store(false);awaitingAck=false;
      if(mqtt.connected())mqtt.disconnect();
      if(networkEnabled&&uint32_t(now-lastWifi)>=10000){lastWifi=now;WiFi.begin(Config::WIFI_SSID,Config::WIFI_PASSWORD);}
    } else {
      if(!clockStarted){configTime(0,0,"pool.ntp.org","time.nist.gov");clockStarted=true;}
      const bool tlsReady=!Config::MQTT_TLS||(Config::MQTT_CA[0]&&time(nullptr)>1700000000);
      if(Config::MQTT_HOST[0]&&tlsReady&&!mqtt.connected()&&uint32_t(now-lastMqtt)>=10000) {
        lastMqtt=now;
        if(mqtt.connect(Config::DEVICE_ID,Config::MQTT_USER[0]?Config::MQTT_USER:nullptr,Config::MQTT_PASSWORD[0]?Config::MQTT_PASSWORD:nullptr,statusTopic,1,true,"{\"online\":false}")) {
          if(!mqtt.subscribe(ackTopic,1))mqtt.disconnect();
          else {mqtt.publish(statusTopic,"{\"online\":true}",true);lastAlert=now-3000;}
        }
      }
      mqtt.loop();mqttOnline.store(mqtt.connected());
      if(ackReceived&&(!ackStoreFailed||uint32_t(now-lastAckStoreAttempt)>=1000)) {
        lastAckStoreAttempt=now;
        AlertJournal candidate=journal;
        if(candidate.pop()&&persist(candidate)){journal=candidate;awaitingAck=false;ackReceived=false;ackStoreFailed=false;lastAlert=now-3000;}
        else ackStoreFailed=true;
      }
      if(mqtt.connected()) {
        Snapshot latest;
        if(uint32_t(now-lastTelemetry)>=2000&&latestReading&&xQueuePeek(latestReading,&latest,0)==pdTRUE) {
          if(publish(telemetryTopic,latest,bootId))lastTelemetry=now;
        }
        if(journal.front()&&uint32_t(now-lastAlert)>=3000) {
          const auto& event=*journal.front();
          snprintf(expectedAck,sizeof(expectedAck),"{\"eventId\":\"%s:%lu\"}",event.boot,static_cast<unsigned long>(event.sample.sequence));
          awaitingAck=true;ackReceived=false;
          publish(alertTopic,event.sample,event.boot);lastAlert=now;
        }
      }
    }
    journalDepth.store(journal.size());
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}
inline void startConnectivity() {
  latestReading=xQueueCreate(1,sizeof(Snapshot));alertEvents=xQueueCreate(16,sizeof(AlertEnvelope));
  snprintf(bootId,sizeof(bootId),"%08lx%08lx",static_cast<unsigned long>(esp_random()),static_cast<unsigned long>(esp_random()));
  if(!validDeviceId()){Serial.println("Invalid device ID; transport disabled, local safety remains active");return;}
  if(xTaskCreatePinnedToCore(connectivityTask,"connectivity",24576,nullptr,1,nullptr,0)!=pdPASS)
    Serial.println("Connectivity task unavailable; local safety remains active");
}
