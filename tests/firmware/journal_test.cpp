#include <cassert>
#include <cstring>
#include <iostream>
#include "../../firmware/src/gas_input_simulation/AlertJournal.h"
AlertEnvelope event(uint32_t seq){AlertEnvelope a{};a.sample={3000,GasState::DANGER,GasState::SAFE,true,seq,500};std::memcpy(a.boot,"0123456789abcdef",17);return a;}
int main(){
 AlertJournal journal;assert(journal.push(event(1)));assert(journal.push(event(2)));
 AlertJournal::Image persisted;std::memcpy(&persisted,&journal.data(),sizeof(persisted));
 AlertJournal rebooted;assert(rebooted.restore(&persisted,sizeof(persisted)));assert(rebooted.front()->sample.sequence==1);
 // Failed publish/no ACK leaves the head intact across restore.
 assert(rebooted.front()->sample.sequence==1);assert(rebooted.pop());
 AlertJournal afterAck;assert(afterAck.restore(&rebooted.data(),sizeof(persisted)));assert(afterAck.front()->sample.sequence==2);
 for(uint32_t i=3;i<=33;i++)assert(afterAck.push(event(i)));assert(afterAck.size()==32);assert(!afterAck.push(event(34)));
 auto corrupt=persisted;corrupt.count=100;assert(!journal.restore(&corrupt,sizeof(corrupt)));
 corrupt=persisted;corrupt.checksum^=1;assert(!journal.restore(&corrupt,sizeof(corrupt)));assert(!journal.restore(&persisted,sizeof(persisted)-1));
 auto invalid=event(3);invalid.boot[0]='!';AlertJournal fresh;assert(!fresh.push(invalid));invalid=event(4);invalid.sample.fan=false;assert(!fresh.push(invalid));
 AlertJournal::LegacyImage legacy{};legacy.count=1;legacy.events[0].sample={3000,GasState::DANGER,GasState::SAFE,true,7,100,SensorStatus::OK};std::memcpy(legacy.events[0].boot,"0123456789abcdef",17);
 uint32_t hash=2166136261u;const auto* bytes=reinterpret_cast<const uint8_t*>(&legacy);
 for(size_t i=0;i<offsetof(AlertJournal::LegacyImage,checksum);i++){hash^=bytes[i];hash*=16777619u;}legacy.checksum=hash;
 AlertJournal migrated;assert(migrated.restore(&legacy,sizeof(legacy)));assert(migrated.front()->sample.sequence==7);assert(migrated.front()->sample.previousSensorStatus==SensorStatus::OK);assert(migrated.data().version==2);
 std::cout<<"Journal restart/order/ACK removal/capacity/corruption/schema validation passed\n";
}
