#!/bin/sh
# Usage: check.sh [--model] [path/to/native-accept-gate.ts]
# Default: per scenario, one TLC run for every rule expected.txt records as holding, one run per rule recorded as broken.
# --model: also the witnesses and the mutants, to show the model can still fail.
# Exit 0: every result matches expected.txt and every mutant is caught; 1: a result changed; 2: a tool error.
set -u

mode=check
if [ "${1:-}" = --model ]; then
  mode=model
  shift
fi
skill=$(cd "$(dirname "$0")" && pwd)
model=${1:-$skill/native-accept-gate.ts}
model=$(cd "$(dirname "$model")" && pwd)/$(basename "$model")
out=$(mktemp -d)

scenarios='
monolith-alive   monolith alive 0 false false
streamer-alive   streamer alive 0 false false
monolith-reopen  monolith dead  0 false false
streamer-reopen  streamer dead  0 false false
monolith-drop    monolith alive 1 false false
streamer-drop    streamer alive 1 false false
monolith-late    monolith alive 0 true  false
streamer-late    streamer alive 0 true  false
monolith-relogin monolith alive 0 false true
streamer-relogin streamer alive 0 false true
'
witnesses='NeverAnswers'

prepare() {
  prepared=$1 source=$2 scenario=$3
  set -- $(echo "$scenarios" | awk -v n="$scenario" '$1==n {print $2, $3, $4, $5, $6}')
  mkdir -p "$prepared"
  cp "$source" "$prepared/native-accept-gate.ts"
  cp "$skill/native-accept-gate.view.ts" "$prepared/"
  printf 'export const SERVER: "monolith" | "streamer" = "%s";\nexport const SOCKET: "alive" | "dead" = "%s";\nexport const MAX_DROPS: number = %s;\nexport const LATE_READY: boolean = %s;\nexport const RELOGIN: boolean = %s;\n' \
    "$1" "$2" "$3" "$4" "$5" > "$prepared/scenario.ts"
}

tlc() {
  run_dir=$1 label=$2
  shift 2
  printf 'SPECIFICATION Spec\nCONSTANTS\n  Null = Null\nINVARIANTS %s\nCHECK_DEADLOCK FALSE\n' "$*" > "$run_dir/$label.cfg"
  (cd "$run_dir" && pnpm dlx tla-ts@0.0.10 -workers 1 -config "$label.cfg" native-accept-gate.ts > "$label.out" 2>&1)
}

path_of() {
  grep -E '^State [0-9]+: <' "$1" | sed -E 's/^State [0-9]+: <([^ >]*).*/\1/' | tail -n +2 | paste -sd' ' -
}

expected_of() {
  awk -v n="$1" -v r="$2" '$1==n && $2==r {print $3}' "$skill/expected.txt"
}

is_witness() {
  case " $witnesses " in *" $1 "*) return 0 ;; esac
  return 1
}

report() {
  dir=$1 name=$2 rule=$3 status=$4
  expected=$(expected_of "$name" "$rule")
  case "$status:$expected" in
    0:holds) echo "HOLDS $name $rule" ;;
    0:breaks) echo "FIXED $name $rule" ;;
    12:breaks) echo "BROKEN-AS-RECORDED $name $rule: $(path_of "$dir/$rule.out")" ;;
    12:*) echo "NEW-BREAK $name $rule: $(path_of "$dir/$rule.out")" ;;
    *) echo "ERROR $name $rule: $dir/$rule.out" ;;
  esac
}

check_scenario() {
  name=$1 source=$2 dir=$out/$name
  prepare "$dir" "$source" "$name"
  holding=$(awk -v n="$name" '$1==n && $3=="holds" {print $2}' "$skill/expected.txt" | paste -sd' ' -)
  breaking=$(awk -v n="$name" '$1==n && $3=="breaks" {print $2}' "$skill/expected.txt")
  if [ -n "$holding" ]; then
    tlc "$dir" holding $holding
    if [ $? -eq 0 ]; then
      for rule in $holding; do echo "HOLDS $name $rule"; done
    else
      for rule in $holding; do
        tlc "$dir" "$rule" "$rule"
        report "$dir" "$name" "$rule" $?
      done
    fi
  fi
  for rule in $breaking; do
    if is_witness "$rule" && [ "$mode" = check ]; then continue; fi
    tlc "$dir" "$rule" "$rule"
    report "$dir" "$name" "$rule" $?
  done
}

mutant() {
  mutant_name=$1 mutant_rule=$2 targets=$3 substitution=$4
  mutated=$out/mutants/$mutant_name/native-accept-gate.ts
  mkdir -p "$(dirname "$mutated")"
  perl -0pe "$substitution" "$model" > "$mutated"
  if cmp -s "$model" "$mutated"; then
    echo "STALE $mutant_name: its edit no longer applies to the model"
    return
  fi
  caught=CAUGHT
  for target in $targets; do
    mutant_dir=$out/mutants/$mutant_name/$target
    prepare "$mutant_dir" "$mutated" "$target"
    tlc "$mutant_dir" "$mutant_rule" "$mutant_rule"
    case $? in
      12) ;;
      0) caught=MISSED ;;
      *) echo "ERROR $mutant_name $target $mutant_rule: $mutant_dir/$mutant_rule.out"; return ;;
    esac
  done
  echo "$caught $mutant_name: $mutant_rule in $targets"
}

{
  echo "$scenarios" | while read -r name rest; do
    [ -z "$name" ] && continue
    check_scenario "$name" "$model"
  done
  if [ "$mode" = model ]; then
    mutant readyFromAnyConnection AnswerOnlyWhenLive 'monolith-reopen streamer-reopen' \
      's/readyOnGen\.get\(([\x27"])media-signal\1\)! === gen(\s*)&&(\s*)readyOnGen\.get\(([\x27"])media-calls\4\)! === gen/readyOnGen.get($1media-signal$1)! > 0$2\&\&$3readyOnGen.get($4media-calls$4)! > 0/'
    mutant readyOnlyForInFlightSub AcceptConnects 'monolith-late streamer-late' \
      's/(records\.add\(sub\);\n)([ \t]*\}\n)([ \t]*)readyOnGen\.set\(sub, gen\);\n/$1$3$3readyOnGen.set(sub, gen);\n$2/'
  fi
} | tee "$out/results.txt"

echo "results: $out"
if grep -q '^ERROR' "$out/results.txt"; then exit 2; fi
if grep -qvE '^(HOLDS|BROKEN-AS-RECORDED|CAUGHT) ' "$out/results.txt"; then exit 1; fi
exit 0
