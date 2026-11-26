#!/usr/bin/env bash
# Model-checks model/workspaceSelection.ts and expects every rule to hold.
# --model also breaks one guard at a time and expects the rule that guards it to catch the break.
# Exit 0 only when every rule holds (and, with --model, every mutant is caught). Tool output goes to a fresh mktemp -d.
set -uo pipefail

skill_dir="$(cd "${SKILL_DIR:-$(dirname "$0")}" && pwd)"
model_file=workspaceSelection.ts
work="$(mktemp -d)"
failures=0

holding_invariants=(liveWorkspaceOpensWithoutReconnect loginlessSelectEndsOnWorkspaceScreen)
holding_properties=(selectPendingNow onLoadingRoot)

report() {
	echo "$1"
	case "$1" in
		HOLDS* | CAUGHT*) ;;
		*) failures=$((failures + 1)) ;;
	esac
}

prepare_run() {
	local name="$1"
	mkdir -p "$work/$name"
	cp "$skill_dir/model/$model_file" "$work/$name/$model_file"
}

run_tlc() {
	local name="$1"
	shift
	(cd "$work/$name" && pnpm dlx tla-ts@0.0.10 "$model_file" -noGenerateSpecTE "$@" >tlc.out 2>&1)
	echo $?
}

write_config() {
	local name="$1"
	shift
	printf 'SPECIFICATION Spec\nCONSTANTS\n  Null = Null\n' >"$work/$name/rules.cfg"
	printf '%s\n' "$@" >>"$work/$name/rules.cfg"
}

violations() {
	local name="$1" rule="$2"
	grep -cE "(Invariant|Temporal property) $rule (is|was) violated" "$work/$name/tlc.out"
}

ran_to_the_end() {
	grep -q "states left on queue" "$work/$1/tlc.out"
}

searched_every_state() {
	grep -q " 0 states left on queue" "$work/$1/tlc.out"
}

check_holding_rules() {
	prepare_run holds
	write_config holds "INVARIANTS ${holding_invariants[*]}" "PROPERTIES ${holding_properties[*]}"
	local status
	status="$(run_tlc holds -config rules.cfg -continue)"
	if [ "$status" -ne 0 ] && ! ran_to_the_end holds; then
		report "ERROR the model did not run (tla-ts exit $status), see $work/holds/tlc.out"
		return
	fi
	if grep -q "Deadlock reached" "$work/holds/tlc.out"; then
		report "NEW-BREAK NoDeadlock"
	fi
	local rule count
	for rule in "${holding_invariants[@]}" "${holding_properties[@]}"; do
		count="$(violations holds "$rule")"
		if [ "$count" -eq 0 ] && searched_every_state holds; then
			report "HOLDS $rule"
		elif [ "$count" -eq 0 ]; then
			report "ERROR $rule not checked: the search stopped early, see $work/holds/tlc.out"
		else
			report "NEW-BREAK $rule ($count violating states)"
		fi
	done
}

edit_model() {
	FROM="$2" TO="$3" perl -0pi -e '
		BEGIN {
			my @pieces = grep { length } split /(\s+|[\x27"])/, $ENV{FROM};
			$pattern = join "", map {
				my $piece = $pieces[$_];
				$piece =~ /^[\x27"]$/ ? q{[\x27"]}
				: $piece !~ /^\s+$/ ? quotemeta $piece
				: $_ == 0 ? q{^[ \t]*}
				: $piece =~ /\n/ ? q{[ \t]*\n\s*}
				: q{\s+}
			} 0 .. $#pieces;
		}
		$found = s/$pattern/$ENV{TO}/m || $found;
		END { exit !$found }
	' "$1"
}

mutant_count=0

count_all_rules() {
	local name="$1"
	run_tlc "$name" -continue -deadlock >/dev/null
	ran_to_the_end "$name"
}

expect_caught() {
	local rule="$1" from="$2" to="$3" name before after
	mutant_count=$((mutant_count + 1))
	name="mutant-$mutant_count"
	prepare_run "$name"
	if ! edit_model "$work/$name/$model_file" "$from" "$to"; then
		report "STALE $rule: mutation target not found: $from"
		return
	fi
	if ! count_all_rules "$name"; then
		report "ERROR $rule: the mutant did not run, see $work/$name/tlc.out"
		return
	fi
	before="$(violations mutant-baseline "$rule")"
	after="$(violations "$name" "$rule")"
	if ((after > before)); then
		report "CAUGHT $rule ($before -> $after violating states)"
	else
		report "MISSED $rule ($before -> $after violating states)"
	fi
}

check_mutants() {
	prepare_run mutant-baseline
	if ! count_all_rules mutant-baseline; then
		report "ERROR the unbroken model did not run, see $work/mutant-baseline/tlc.out"
		return
	fi
	expect_caught loginlessSelectEndsOnWorkspaceScreen '	if (sdkHost === server && hasToken(server)) {' '	if (sdkHost === server) {'
	expect_caught liveWorkspaceOpensWithoutReconnect '	if (sdkHost === server && hasToken(server)) {' '	if (sdkHost === server && hasToken(server) && selectConnected) {'
	expect_caught selectPendingNow '	if (selectPending === null || !selectConnected) return;' '	if (selectPending === null || !selectConnected || user === null) return;'
	expect_caught onLoadingRoot "		share = 'GaveUp';
		root = 'Outside';" "		share = 'GaveUp';"
}

check_holding_rules
if [ "${1:-}" = "--model" ]; then
	check_mutants
fi

if ((failures > 0)); then
	echo "tla-ts output: $work"
	exit 1
fi
exit 0
