#include <cassert>
#include <iostream>
#include "../../firmware/src/gas_input_simulation/SensorHealth.h"
int main(){
 SensorHealth sensor({5000,true,0,4095,5000,3});
 assert(sensor.update(1000,0)==SensorStatus::WARMING_UP);assert(sensor.update(1000,4999)==SensorStatus::WARMING_UP);
 assert(sensor.update(1000,5000)==SensorStatus::OK);
 assert(sensor.update(0,6000)==SensorStatus::OK);assert(sensor.update(0,10999)==SensorStatus::OK);assert(sensor.update(0,11000)==SensorStatus::LOW_RAIL);
 assert(sensor.update(1000,11500)==SensorStatus::LOW_RAIL);assert(sensor.update(1000,12000)==SensorStatus::LOW_RAIL);assert(sensor.update(1000,12500)==SensorStatus::OK);
 assert(sensor.update(4095,13000)==SensorStatus::OK);assert(sensor.update(4095,18000)==SensorStatus::HIGH_RAIL);
 SensorHealth wrap({20,true,0,4095,10,1});assert(wrap.update(1000,UINT32_MAX-9)==SensorStatus::WARMING_UP);assert(wrap.update(1000,10)==SensorStatus::OK);
 assert(wrap.update(0,UINT32_MAX-4)==SensorStatus::OK);assert(wrap.update(0,5)==SensorStatus::LOW_RAIL);
 SensorHealth simulated({0,false,0,4095,100,1});assert(simulated.update(0,0)==SensorStatus::OK);assert(simulated.update(4095,100000)==SensorStatus::OK);
 assert((!SensorHealthLimits{0,true,4095,0,1,1}.valid()));
 std::cout<<"Warm-up, rail persistence, debounced recovery, timer wrap and simulation bypass passed\n";
}
