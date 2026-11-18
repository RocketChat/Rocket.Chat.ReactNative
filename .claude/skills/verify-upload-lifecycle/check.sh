#!/usr/bin/env bash
set -euo pipefail

model_dir="$(cd "$(dirname "$0")/model" && pwd)"
output="$(mktemp -t upload-lifecycle-tlc)"

cd "$model_dir"
set +e
pnpm dlx tla-ts@0.0.10 upload-lifecycle.ts -continue -noGenerateSpecTE >"$output" 2>&1
status=$?
set -e

broken="$(grep -o 'Invariant [A-Za-z]* is violated' "$output" | sort -u || true)"
grep -E 'distinct states found' "$output" || true

if [ -n "$broken" ]; then
	echo "$broken"
	echo "FAIL: full TLC output in $output"
	exit 1
fi
if [ "$status" -ne 0 ]; then
	echo "ERROR: tla-ts exited $status without a rule violation (compile or model error); see $output"
	exit 2
fi
echo "PASS: every rule holds"
