#!/usr/bin/env bash
set -euo pipefail
# Rebuild the browser module from src/converter.c.
# Requires Clang with a wasm32 target and wasm-ld.
exec "$(dirname "$0")/compile-wasm.sh"
