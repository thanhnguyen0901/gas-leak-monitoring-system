#pragma once
#include <stdint.h>
#include "GasState.h"
#include "SensorHealth.h"
#if defined(GAS_CONFIG_HEADER)
#define GAS_STRINGIFY_INNER(value) #value
#define GAS_STRINGIFY(value) GAS_STRINGIFY_INNER(value)
#include GAS_STRINGIFY(GAS_CONFIG_HEADER)
#elif __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif

static_assert(Config::SIMULATED_INPUT || Config::CALIBRATION_CONFIRMED,
              "Physical mode requires reviewed real hardware calibration");
static_assert(Thresholds{Config::WARNING_ADC, Config::DANGER_ADC, Config::HYSTERESIS_ADC}.valid(),
              "Raw ADC threshold configuration is invalid");

static_assert(Config::SIMULATED_INPUT || Config::SENSOR_WARMUP_MS>0,
              "Physical mode requires explicit datasheet-reviewed sensor warm-up");
static_assert(SensorHealthLimits{Config::SENSOR_WARMUP_MS,Config::SENSOR_DIAGNOSTICS_ENABLED,Config::SENSOR_LOW_RAIL,Config::SENSOR_HIGH_RAIL,Config::SENSOR_RAIL_FAULT_MS,Config::SENSOR_RECOVERY_SAMPLES}.valid(),
              "Invalid sensor health configuration");
