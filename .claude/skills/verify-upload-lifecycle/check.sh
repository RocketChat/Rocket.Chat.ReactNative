#!/usr/bin/env bash
# Model-checks the upload lifecycle with tla-ts in a fresh temp folder, then confirms each recorded finding still breaks.
# --model also runs the mutants and four sends. An optional path checks an edited copy of the model.
set -uo pipefail

skill_dir="$(cd "$(dirname "$0")" && pwd)"
check_model=false
model="$skill_dir/model/upload-lifecycle.ts"
for argument in "$@"; do
	if [[ "$argument" == --model ]]; then
		check_model=true
	else
		model="$argument"
	fi
done
model_file="$(basename "$model")"
rules=(neverRefusedAfterUploadEnded runningUploadNeverShownFailed)
work="$(mktemp -d)"
failures=0
run_count=0

new_run() {
	run_count=$((run_count + 1))
	run_dir="$work/run-$run_count"
	mkdir -p "$run_dir"
	cp "$model" "$run_dir/$model_file"
}

run_tlc() {
	(cd "$run_dir" && pnpm dlx tla-ts@0.0.10 "$model_file" -noGenerateSpecTE) >"$run_dir/tlc.out" 2>&1
}

is_broken() {
	grep -qE "Invariant $1 is violated" "$run_dir/tlc.out"
}

holds_everywhere() {
	grep -q 'Model checking completed. No error has been found.' "$run_dir/tlc.out"
}

apply_mutation() {
	local from="$1" to="$2"
	if ! FROM="$from" perl -0ne 'exit(index($_, $ENV{FROM}) < 0 ? 1 : 0)' "$run_dir/$model_file"; then
		return 1
	fi
	FROM="$from" TO="$to" perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$run_dir/$model_file"
}

keep_only_rule() {
	local rule="$1" other
	for other in "${rules[@]}"; do
		if [[ "$other" != "$rule" ]]; then
			RULE="$other" perl -pi -e 's/^export const \Q$ENV{RULE}\E = \(\) => .*;$/export const $ENV{RULE} = () => true;/' "$run_dir/$model_file"
		fi
	done
}

report_expected_holds() {
	local label="$1" rule
	if holds_everywhere; then
		for rule in "${rules[@]}"; do
			echo "HOLDS  $rule$label"
		done
		grep -oE '[0-9]+ distinct states found' "$run_dir/tlc.out" | sed "s/\$/$label/" || true
		return
	fi
	local broke=false
	for rule in "${rules[@]}"; do
		if is_broken "$rule"; then
			echo "NEW-BREAK $rule$label (output in $run_dir/tlc.out)"
			broke=true
		fi
	done
	if $broke; then
		echo "ERROR  the other rules are unchecked$label: TLC stops at the first break"
	else
		echo "ERROR  model$label: tla-ts did not finish; output in $run_dir/tlc.out"
	fi
	failures=$((failures + 1))
}

check_expected_holds() {
	new_run
	run_tlc
	report_expected_holds ""
}

expect_recorded_break() {
	local rule="$1" finding="$2" guard_from="$3" guard_to="$4"
	new_run
	if ! apply_mutation "$guard_from" "$guard_to"; then
		echo "STALE  $rule: $finding (guard text not found in the model)"
		failures=$((failures + 1))
		return
	fi
	keep_only_rule "$rule"
	run_tlc
	if is_broken "$rule"; then
		echo "BROKEN-AS-RECORDED $rule: $finding"
	elif holds_everywhere; then
		echo "FIXED  $rule: $finding (drop the guard and this record)"
		failures=$((failures + 1))
	else
		echo "ERROR  $rule: $finding (output in $run_dir/tlc.out)"
		failures=$((failures + 1))
	fi
}

check_recorded_breaks() {
	expect_recorded_break runningUploadNeverShownFailed 'a second send of the file while the first is preparing is not refused' "	if (force && record !== 'failed') return;
	if (somethingPreparing()) return;" "	if (force && record !== 'failed') return;"
	expect_recorded_break runningUploadNeverShownFailed 'opening the Room while the file is preparing marks the row failed' "	if (record === 'none' || queued !== null) return;
	if (somethingPreparing()) return;" "	if (record === 'none' || queued !== null) return;"
	expect_recorded_break runningUploadNeverShownFailed 'cancelling while the file is preparing only destroys the row' "	if (record !== 'uploading') return;
	if (somethingPreparing()) return;" "	if (record !== 'uploading') return;"
}

expect_caught() {
	local rule="$1" mutation="$2" from="$3" to="$4"
	new_run
	if ! apply_mutation "$from" "$to"; then
		echo "STALE  $rule: $mutation (target text not found in the model)"
		failures=$((failures + 1))
		return
	fi
	keep_only_rule "$rule"
	run_tlc
	if is_broken "$rule"; then
		echo "CAUGHT $rule: $mutation"
	elif holds_everywhere; then
		echo "MISSED $rule: $mutation"
		failures=$((failures + 1))
	else
		echo "ERROR  $rule: $mutation (output in $run_dir/tlc.out)"
		failures=$((failures + 1))
	fi
}

run_mutants() {
	expect_caught runningUploadNeverShownFailed 'isUploadCancelled checks for an empty queue entry instead of its own upload' 'const isUploadCancelled = (send: Send) => queued !== send;' 'const isUploadCancelled = (send: Send) => queued === null;'
	expect_caught runningUploadNeverShownFailed 'endUpload deletes the queue entry of a newer upload' '	if (queued === send) {
		queued = null;' '	if (queued !== null) {
		queued = null;'
	expect_caught neverRefusedAfterUploadEnded 'cancelUpload leaves the queue entry behind' '		cancelled[queued] = true;
	}
	queued = null;' '		cancelled[queued] = true;
	}'
	expect_caught neverRefusedAfterUploadEnded 'a restart keeps the in-memory queue' "		third: call.third === 'notSent' ? 'notSent' : 'ended'
	};
	queued = null;" "		third: call.third === 'notSent' ? 'notSent' : 'ended'
	};"
}

check_four_sends() {
	new_run
	apply_mutation "type Send = 'first' | 'second' | 'third';" "type Send = 'first' | 'second' | 'third' | 'fourth';" &&
		apply_mutation "const sends: Send[] = ['first', 'second', 'third'];" "const sends: Send[] = ['first', 'second', 'third', 'fourth'];" &&
		apply_mutation "{ first: 'notSent', second: 'notSent', third: 'notSent' }" "{ first: 'notSent', second: 'notSent', third: 'notSent', fourth: 'notSent' }" &&
		apply_mutation '{ first: false, second: false, third: false }' '{ first: false, second: false, third: false, fourth: false }' &&
		apply_mutation "		third: call.third === 'notSent' ? 'notSent' : 'ended'" "		third: call.third === 'notSent' ? 'notSent' : 'ended',
		fourth: call.fourth === 'notSent' ? 'notSent' : 'ended'"
	if [[ $? -ne 0 ]]; then
		echo "STALE  four sends: the three-send declarations changed; update check_four_sends"
		failures=$((failures + 1))
		return
	fi
	run_tlc
	report_expected_holds " (four sends)"
}

check_expected_holds
check_recorded_breaks
if $check_model; then
	run_mutants
	check_four_sends
fi

exit $((failures > 0))
