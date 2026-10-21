#!/usr/bin/env bash
set -euo pipefail

node "$(dirname "$0")/redact-e2e-output.mjs" "${1:-.e2e}"
