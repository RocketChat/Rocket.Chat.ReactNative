#!/usr/bin/env bash
# Usage: check.sh [--model]
# Runs the real getSlashCommands under Jest in every world of the harness and prints one line per rule.
# --model also runs each mutation in harness/mutations.js, which must be CAUGHT.
# Exit 0: every rule holds (and with --model every mutant is caught); 1: a rule broke or a mutant was missed or stale; 2: tool error.
set -uo pipefail

skill_dir="${SKILL_DIR:-$(cd "$(dirname "$0")" && pwd)}"
skill_dir="$(cd "$skill_dir" && pwd)"
repo="$(git -C "$skill_dir" rev-parse --show-toplevel)"
out="$(mktemp -d -t verify-slash-commands-sync)"
check_model=false
[ "${1:-}" = --model ] && check_model=true

echo "output: $out"

run_harness() {
	local mutant="$1" log="$2"
	(cd "$repo" && TZ=UTC SC_MUTANT="$mutant" VERIFY_JEST_CACHE="$out/jest-cache" \
		pnpm -s jest -c "$skill_dir/harness/jest.config.js" --ci >"$log" 2>&1)
	sed -n 's/^SC_RESULT //p' "$log" | tail -1
}

baseline_log="$out/baseline.log"
baseline="$(run_harness "" "$baseline_log")"
if [ -z "$baseline" ]; then
	echo "ERROR  harness did not finish (log: $baseline_log)"
	exit 2
fi

node -e '
const counts = JSON.parse(process.argv[1]);
for (const [rule, failing] of Object.entries(counts)) {
	console.log(failing === 0 ? `HOLDS  ${rule}` : `NEW-BREAK ${rule} (${failing} failing runs; shortest run in ${process.argv[2]})`);
}
process.exit(Object.values(counts).every(failing => failing === 0) ? 0 : 1);
' "$baseline" "$baseline_log"
status=$?
grep -oE '^checked [0-9]+ runs' "$baseline_log" || true

if $check_model; then
	mutants="$(node -e 'console.log(Object.keys(require(process.argv[1])).join(" "))' "$skill_dir/harness/mutations.js")"
	for mutant in $mutants; do
		log="$out/$mutant.log"
		result="$(run_harness "$mutant" "$log")"
		if grep -q "MUTANT_STALE" "$log"; then
			echo "STALE  $mutant (target text not found in getSlashCommands.ts)"
			[ "$status" -eq 0 ] && status=1
			continue
		fi
		if [ -z "$result" ]; then
			echo "ERROR  $mutant (log: $log)"
			[ "$status" -lt 2 ] && status=2
			continue
		fi
		grew="$(node -e '
const base = JSON.parse(process.argv[1]);
const mutated = JSON.parse(process.argv[2]);
console.log(Object.keys(mutated).filter(rule => mutated[rule] > base[rule]).join(","));
' "$baseline" "$result")"
		if [ -n "$grew" ]; then
			echo "CAUGHT $mutant -> $grew"
		else
			echo "MISSED $mutant"
			[ "$status" -eq 0 ] && status=1
		fi
	done
fi

exit "$status"
