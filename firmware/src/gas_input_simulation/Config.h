#pragma once
#include <stdint.h>
#include "GasState.h"
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
