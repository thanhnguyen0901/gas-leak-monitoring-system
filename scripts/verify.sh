#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compiler="${CXX:-clang++}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
for test in tests/firmware/*_test.cpp; do
  "$compiler" -std=c++17 -Wall -Wextra -Werror "$test" -o "$tmp/test"
  "$tmp/test"
done
python3 tests/firmware/config_guard.py
python3 tests/calibration_test.py
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run build
if [[ "${RUN_DOCKER_TESTS:-0}" == 1 ]]; then
  python3 tests/run-postgres.py
  python3 tests/run-postgres.py --suite system
  python3 tests/run-postgres.py --suite failure
fi
if [[ "${RUN_FIRMWARE_BUILD:-0}" == 1 ]]; then scripts/build-firmware.sh; fi
echo "Selected automated checks completed. Wokwi/live services/physical acceptance remain manual."
