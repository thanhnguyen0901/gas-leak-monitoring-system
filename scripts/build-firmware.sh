#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cli="${ARDUINO_CLI:-arduino-cli}"
if ! command -v "$cli" >/dev/null 2>&1; then
  cli="/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli"
fi
extra=()
if [[ -n "${ARDUINO_LIBRARIES_DIR:-}" ]]; then extra+=(--libraries "$ARDUINO_LIBRARIES_DIR"); fi
if [[ -n "${GAS_CONFIG_HEADER:-}" ]]; then
  if [[ "$GAS_CONFIG_HEADER" =~ [[:space:]] ]]; then
    echo "Use an absolute config header path without whitespace" >&2; exit 1
  fi
  extra+=(--build-property "compiler.cpp.extra_flags=-DGAS_CONFIG_HEADER=$GAS_CONFIG_HEADER")
fi
"$cli" compile --fqbn esp32:esp32:esp32doit-devkit-v1 \
  --build-path "${GAS_BUILD_DIR:-/tmp/gas-monitor-build}" \
  --output-dir firmware/wokwi/build "${extra[@]}" firmware/src/gas_input_simulation
