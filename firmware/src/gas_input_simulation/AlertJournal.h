#pragma once
#include <stddef.h>
#include <cstring>
#include <type_traits>
#include "Snapshot.h"
// Bounded, checksummed NVS image; only transition events, never periodic telemetry.
class AlertJournal {
 public:
  static constexpr uint32_t CAPACITY=32;
  struct Image {
    uint32_t magic=0x47415341,version=1,count=0;
    AlertEnvelope events[CAPACITY]{};
    uint32_t checksum=0;
  };
 private:
  Image image{};
  static uint32_t checksum(const Image& value) {
    uint32_t hash=2166136261u;
    const auto* bytes=reinterpret_cast<const uint8_t*>(&value);
    for(size_t i=0;i<offsetof(Image,checksum);i++){hash^=bytes[i];hash*=16777619u;}
    return hash;
  }
  static bool validEvent(const AlertEnvelope& event) {
    if(event.sample.raw<0||event.sample.raw>4095||unsigned(event.sample.state)>2||unsigned(event.sample.previous)>2||unsigned(event.sample.sensorStatus)>3)return false;
    if(event.sample.fan!=(event.sample.state!=GasState::SAFE)||event.boot[16]!='\0')return false;
    for(size_t i=0;i<16;i++)if(!((event.boot[i]>='0'&&event.boot[i]<='9')||(event.boot[i]>='a'&&event.boot[i]<='f')))return false;
    return true;
  }
  void seal(){image.checksum=checksum(image);}
 public:
  AlertJournal(){seal();}
  bool restore(const void* bytes,size_t size) {
    static_assert(std::is_trivially_copyable<Image>::value,"Journal image must remain byte-copyable");
    if(size!=sizeof(Image))return false;
    Image candidate;std::memcpy(&candidate,bytes,size);
    if(candidate.magic!=0x47415341||candidate.version!=1||candidate.count>CAPACITY||candidate.checksum!=checksum(candidate))return false;
    for(uint32_t i=0;i<candidate.count;i++)if(!validEvent(candidate.events[i]))return false;
    std::memcpy(&image,&candidate,sizeof(Image));return true;
  }
  bool push(const AlertEnvelope& event) {
    if(image.count==CAPACITY||!validEvent(event))return false;
    image.events[image.count++]=event;seal();return true;
  }
  bool pop() {
    if(!image.count)return false;
    image.count--;
    if(image.count)std::memmove(image.events,image.events+1,image.count*sizeof(AlertEnvelope));
    image.events[image.count]=AlertEnvelope{};seal();return true;
  }
  const AlertEnvelope* front()const{return image.count?&image.events[0]:nullptr;}
  uint32_t size()const{return image.count;}
  const Image& data()const{return image;}
};
