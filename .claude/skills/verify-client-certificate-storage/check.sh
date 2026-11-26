#!/usr/bin/env bash
# Model-checks client-certificate-storage.ts and compares every rule with the result recorded below.
# --model also breaks one guard at a time and expects the rule that guards it to catch the break.
# Exit 0 only when every line matches the record. Tool output goes to a fresh mktemp -d.
set -uo pipefail

skill_dir="${SKILL_DIR:-$(cd "$(dirname "$0")" && pwd)}"
model_file=client-certificate-storage.ts
work="$(mktemp -d)"
failures=0

holding_rules=(savedCertificateStaysLoadable removedCertificateIsNotPresented)
recorded_breaks=(
	"connectedWorkspacePresentsItsCertificate 84"
	"hostCertificateHeldOnlyWhileUsed 16"
)

report() {
	echo "$1"
	case "$1" in
		HOLDS* | BROKEN-AS-RECORDED* | CAUGHT*) ;;
		*) failures=$((failures + 1)) ;;
	esac
}

prepare_run() {
	local name="$1"
	mkdir -p "$work/$name"
	cp "$skill_dir/$model_file" "$work/$name/$model_file"
}

run_tlc() {
	local name="$1"
	shift
	(cd "$work/$name" && pnpm dlx tla-ts@0.0.10 "$model_file" -noGenerateSpecTE "$@" >tlc.out 2>&1)
	echo $?
}

write_config() {
	local name="$1" keyword="$2"
	shift 2
	printf 'SPECIFICATION Spec\nCONSTANTS\n  Null = Null\n%s %s\n' "$keyword" "$*" >"$work/$name/rules.cfg"
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
	write_config holds INVARIANTS "${holding_rules[@]}"
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
	for rule in "${holding_rules[@]}"; do
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

check_recorded_break() {
	local rule="$1" recorded="$2" status count
	prepare_run "$rule"
	write_config "$rule" INVARIANT "$rule"
	status="$(run_tlc "$rule" -config rules.cfg -continue -deadlock)"
	if [ "$status" -ne 0 ] && ! ran_to_the_end "$rule"; then
		report "ERROR $rule: the model did not run (tla-ts exit $status), see $work/$rule/tlc.out"
		return
	fi
	count="$(violations "$rule" "$rule")"
	if ! searched_every_state "$rule"; then
		report "ERROR $rule: the search stopped early, see $work/$rule/tlc.out"
	elif [ "$count" -eq 0 ]; then
		report "FIXED $rule (recorded $recorded violating states, now 0): update the known findings"
	elif [ "$count" -eq "$recorded" ]; then
		report "BROKEN-AS-RECORDED $rule ($count violating states)"
	else
		report "NEW-BREAK $rule ($count violating states, recorded $recorded)"
	fi
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
	if ! FROM="$from" perl -0ne 'exit(index($_, $ENV{FROM}) < 0 ? 1 : 0)' "$work/$name/$model_file"; then
		report "STALE $rule: mutation target not found: $from"
		return
	fi
	FROM="$from" TO="$to" perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$work/$name/$model_file"
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
	expect_caught savedCertificateStaysLoadable '	if (certificate !== null && !isCertificateInUse(certificate)) {' '	if (certificate !== null) {'
	expect_caught removedCertificateIsNotPresented '	hostCertificate = null;
	if (selected !== null) {' '	if (selected !== null) {'
	expect_caught connectedWorkspacePresentsItsCertificate '	connected = workspace;
	applyServerCertificate(workspace);
};' '	connected = workspace;
};'
	expect_caught hostCertificateHeldOnlyWhileUsed '	const sameHost = servers.size > 0;' '	const sameHost = true;'
}

check_holding_rules
for entry in "${recorded_breaks[@]}"; do
	check_recorded_break $entry
done
if [ "${1:-}" = "--model" ]; then
	check_mutants
fi

if ((failures > 0)); then
	echo "tla-ts output: $work"
	exit 1
fi
exit 0
