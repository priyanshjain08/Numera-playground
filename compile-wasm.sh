#!/usr/bin/env bash
set -euo pipefail
mkdir -p wasm
clang --target=wasm32 -O2 -nostdlib src/converter.c \
  -Wl,--no-entry -Wl,--export=numera_convert -Wl,--export-memory \
  -Wl,--allow-undefined -o wasm/converter.wasm
echo "Built wasm/converter.wasm using clang (freestanding build)."
