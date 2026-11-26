#!/bin/sh
# Usage: check.sh [--model]
# Default: the model with every run reaching a settled state, the known-broken rule noConnectAfterUserEnd,
# and the replay of that bug against the real code.
# --model: also the witness that a call can connect, and the model with every bound raised by one.
# Exit 0: every result is as recorded; 1: a result changed; 2: a tool error.
set -u

mode=check
[ "${1:-}" = --model ] && mode=model
skill=$(cd "$(dirname "$0")" && pwd)
repo=$(git rev-parse --show-toplevel)
work=$(mktemp -d)
rules='noConnectAfterUserEnd'
known_broken='noConnectAfterUserEnd'

is_known_broken() {
  case " $known_broken " in *" $1 "*) return 0 ;; esac
  return 1
}

holding=$(for rule in $rules; do is_known_broken "$rule" || printf '%s ' "$rule"; done)

tlc() {
  run_dir=$1 label=$2
  shift 2
  mkdir -p "$run_dir"
  [ -f "$run_dir/voip-accept.ts" ] || cp "$skill/model/voip-accept.ts" "$run_dir/"
  if [ $# -gt 0 ]; then
    printf 'SPECIFICATION Spec\nINVARIANTS %s\n' "$*" > "$run_dir/$label.cfg"
  else
    printf 'SPECIFICATION Spec\n' > "$run_dir/$label.cfg"
  fi
  (cd "$run_dir" && pnpm dlx tla-ts@0.0.10 -workers 1 -config "$label.cfg" voip-accept.ts > "$label.out" 2>&1)
}

path_of() {
  grep -E '^State [0-9]+: <' "$1" | sed -E 's/^State [0-9]+: <([^ >]*).*/\1/' | tail -n +2 | paste -sd' ' -
}

distinct_states() {
  sed -nE 's/.* ([0-9]+) distinct states found.*/\1/p' "$1" | tail -1
}

settled_line() {
  run_dir=$1 status=$2 suffix=$3
  case $status in
    0) echo "HOLDS settled$suffix" ;;
    11 | 12) echo "NEW-BREAK settled$suffix: $(path_of "$run_dir/settled.out")" ;;
    *) echo "ERROR settled$suffix: $run_dir/settled.out" ;;
  esac
}

rule_line() {
  run_dir=$1 rule=$2 status=$3 recorded=$4
  if [ "$status" -eq 12 ] && grep -q "Invariant $rule is violated" "$run_dir/$rule.out"; then
    if [ "$recorded" = broken ]; then
      echo "BROKEN-AS-RECORDED $rule: $(path_of "$run_dir/$rule.out")"
    else
      echo "NEW-BREAK $rule: $(path_of "$run_dir/$rule.out")"
    fi
  elif [ "$status" -eq 0 ]; then
    if [ "$recorded" = broken ]; then echo "FIXED $rule"; else echo "HOLDS $rule"; fi
  else
    echo "ERROR $rule: $run_dir/$rule.out"
  fi
}

replay() {
  recorded=holds
  is_known_broken noConnectAfterUserEnd && recorded=broken
  replay_dir=$work/replay
  mkdir -p "$replay_dir"
  (cd "$repo" && pnpm exec jest --cacheDirectory "$replay_dir/cache" --testPathIgnorePatterns /node_modules/ \
    --json --outputFile "$replay_dir/results.json" "$skill/replay" > "$replay_dir/jest.out" 2>&1)
  node -e '
    const results = require(process.argv[1]);
    const suites = results.testResults;
    const labels = process.argv[3] === "broken" ? ["BROKEN-AS-RECORDED", "FIXED"] : ["HOLDS", "NEW-BREAK"];
    if (results.numRuntimeErrorTestSuites > 0 || suites.length === 0 || suites.some(suite => suite.assertionResults.length === 0)) {
      console.log(`ERROR replay: ${process.argv[2]}`);
      process.exit(0);
    }
    for (const suite of suites)
      for (const test of suite.assertionResults)
        console.log(`${labels[test.status === "passed" ? 0 : 1]} noConnectAfterUserEnd replay: ${test.title}`);
  ' "$replay_dir/results.json" "$replay_dir/jest.out" "$recorded" 2>/dev/null || echo "ERROR replay: $replay_dir/jest.out"
}

{
  tlc "$work/model" holding $holding
  if [ $? -eq 0 ]; then
    echo "HOLDS settled"
    for rule in $holding; do echo "HOLDS $rule"; done
  else
    tlc "$work/model" settled
    settled_line "$work/model" $? ""
    for rule in $holding; do
      tlc "$work/model" "$rule" "$rule"
      rule_line "$work/model" "$rule" $? holds
    done
  fi
  for rule in $known_broken; do
    tlc "$work/model" "$rule" "$rule"
    rule_line "$work/model" "$rule" $? broken
  done
  replay
  if [ "$mode" = model ]; then
    tlc "$work/model" neverConnects neverConnects
    rule_line "$work/model" neverConnects $? broken

    bigger=$work/bigger-bounds
    mkdir -p "$bigger"
    sed -e 's/^const MAX_GATE_STARTS = 3;$/const MAX_GATE_STARTS = 4;/' \
      -e 's/^const MAX_UNGATED_REPLAYS = 2;$/const MAX_UNGATED_REPLAYS = 3;/' \
      "$skill/model/voip-accept.ts" > "$bigger/voip-accept.ts"
    if [ "$(diff "$skill/model/voip-accept.ts" "$bigger/voip-accept.ts" | grep -c '^>')" -ne 2 ]; then
      echo "STALE biggerBounds: MAX_GATE_STARTS = 3 or MAX_UNGATED_REPLAYS = 2 is no longer in the model"
    else
      tlc "$bigger" settled
      settled_line "$bigger" $? " (bounds + 1)"
      base=$(distinct_states "$work/model/holding.out")
      raised=$(distinct_states "$bigger/settled.out")
      if [ -n "$base" ] && [ "$base" = "$raised" ]; then
        echo "HOLDS biggerBounds: $base distinct states at both bounds"
      else
        echo "NEW-BREAK biggerBounds: ${base:-?} distinct states at the bounds, ${raised:-?} with each bound raised by one"
      fi
    fi
  fi
} | tee "$work/results.txt"

echo "results: $work"
if grep -q '^ERROR' "$work/results.txt"; then exit 2; fi
if grep -qvE '^(HOLDS|BROKEN-AS-RECORDED|CAUGHT) ' "$work/results.txt"; then exit 1; fi
exit 0
