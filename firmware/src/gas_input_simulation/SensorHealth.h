#pragma once
#include <stdint.h>
#include "SensorStatus.h"
struct SensorHealthLimits {
  uint32_t warmupMs=0;
  bool enabled=false;
  int lowRail=0,highRail=4095;
  uint32_t railDurationMs=5000;
  uint16_t recoverySamples=3;
  constexpr bool valid()const{return warmupMs<=0x7fffffffu&&lowRail>=0&&highRail<=4095&&lowRail<highRail&&railDurationMs>0&&railDurationMs<=0x7fffffffu&&recoverySamples>0&&recoverySamples<=1000;}
};
class SensorHealth {
  SensorHealthLimits limits;
  bool started=false,warmed=false,verifying=false;
  uint32_t start=0,railStart=0;
  SensorStatus rail=SensorStatus::OK,latched=SensorStatus::OK;
  uint16_t good=0;
 public:
  explicit SensorHealth(SensorHealthLimits value):limits(value){}
  SensorStatus update(int raw,uint32_t now) {
    if(!started){started=true;start=now;}
    if(!warmed){if(uint32_t(now-start)<limits.warmupMs)return SensorStatus::WARMING_UP;warmed=true;}
    if(!limits.enabled)return SensorStatus::OK;
    const auto current=raw<=limits.lowRail?SensorStatus::LOW_RAIL:raw>=limits.highRail?SensorStatus::HIGH_RAIL:SensorStatus::OK;
    if(current!=SensorStatus::OK){
      verifying=true;good=0;if(current!=rail){rail=current;railStart=now;}
      if(raw<0||raw>4095||uint32_t(now-railStart)>=limits.railDurationMs)latched=current;
    }else{
      rail=SensorStatus::OK;
      if((latched!=SensorStatus::OK||verifying)&&++good>=limits.recoverySamples){latched=SensorStatus::OK;verifying=false;good=0;}
    }
    return latched!=SensorStatus::OK?latched:verifying?SensorStatus::VERIFYING_SIGNAL:SensorStatus::OK;
  }
};
