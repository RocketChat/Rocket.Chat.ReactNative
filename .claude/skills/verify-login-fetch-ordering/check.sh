#!/usr/bin/env bash
# Usage: check.sh [--model]
# Model-checks the login fetch ordering and runs the getSettings pagination harness.
# --model adds the AtomicCheck=FALSE runs and the mutants.
# Exit 0: every result equals the recorded result; 1: a result changed; 2: tool error.
set -uo pipefail

skill_dir="${SKILL_DIR:-$(cd "$(dirname "$0")" && pwd)}"
skill_dir="$(cd "$skill_dir" && pwd)"
repo="$(git -C "$skill_dir" rev-parse --show-toplevel)"
out="$(mktemp -d -t verify-login-fetch-ordering)"
model_flag=""
[ "${1:-}" = --model ] && model_flag=--model

echo "output: $out"

(cd "$out" && OUT_DIR="$out" pnpm -s --package=tla-ts@0.0.10 dlx sh -c \
	'TLA_TS_ENTRY="$(dirname "$(command -v tla-ts)")/../tla-ts/dist/index.js" node "$@"' \
	tla-ts "$skill_dir/model/check.mjs" $model_flag)
model_status=$?

(cd "$repo" && TZ=UTC VERIFY_JEST_CACHE="$out/jest-cache" pnpm -s jest -c "$skill_dir/harness/jest.config.js" \
	--ci --json --outputFile="$out/jest.json" >"$out/jest.log" 2>&1)
jest_verdict="$(node -e '
const fs = require("fs");
try {
	const run = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
	if (run.numTotalTests > 0 && run.success) console.log("HOLDS");
	else if (run.numFailedTests > 0) console.log("NEW-BREAK");
	else console.log("ERROR");
} catch {
	console.log("ERROR");
}' "$out/jest.json")"
echo "$jest_verdict getSettings-pagination matches-old-sequential-loop (log: $out/jest.log)"

if [ "$model_status" -ge 2 ] || [ "$jest_verdict" = ERROR ]; then exit 2; fi
if [ "$model_status" -ne 0 ] || [ "$jest_verdict" != HOLDS ]; then exit 1; fi
exit 0
