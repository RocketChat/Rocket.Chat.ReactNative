#!/usr/bin/env bash
# Model-checks biometric trust with tla-ts in a fresh temp folder. --model also runs the mutants.
set -uo pipefail

skill_dir="$(cd "$(dirname "$0")" && pwd)"
model="$skill_dir/model/biometricTrust.ts"
model_file="$(basename "$model")"
rules=(enabledOnlyWithConsent noBiometricUnlockAfterTrustLoss trustLossForcesPasscode relockClearedOnlyAfterPasscode NoDeadlock)
work="$(mktemp -d)"
failures=0

run_tlc() {
	local dir="$1"
	shift
	(cd "$dir" && pnpm dlx tla-ts@0.0.10 "$model_file" -noGenerateSpecTE "$@") >"$dir/tlc.out" 2>&1
}

is_broken() {
	local rule="$1" output="$2"
	if [[ "$rule" == NoDeadlock ]]; then
		grep -q 'Deadlock reached' "$output"
	else
		grep -qE "Invariant $rule is violated" "$output"
	fi
}

finished_cleanly() {
	grep -qE 'Model checking completed|is violated|Deadlock reached' "$1"
}

keep_only_rule() {
	local rule="$1" file="$2" other
	for other in "${rules[@]}"; do
		if [[ "$other" != "$rule" && "$other" != NoDeadlock ]]; then
			RULE="$other" perl -pi -e 's/^export const \Q$ENV{RULE}\E = \(\) => .*;$/export const $ENV{RULE} = () => true;/' "$file"
		fi
	done
}

check_expected_holds() {
	local dir="$work/holds" rule
	mkdir -p "$dir"
	cp "$model" "$dir/$model_file"
	run_tlc "$dir"
	if ! finished_cleanly "$dir/tlc.out"; then
		echo "ERROR  model: tla-ts did not finish; output in $dir/tlc.out"
		failures=$((failures + 1))
		return
	fi
	if ! grep -q 'Model checking completed. No error has been found.' "$dir/tlc.out"; then
		for rule in "${rules[@]}"; do
			if is_broken "$rule" "$dir/tlc.out"; then
				echo "NEW-BREAK $rule (output in $dir/tlc.out)"
			fi
		done
		echo "ERROR  the other rules are unchecked: TLC stops at the first break"
		failures=$((failures + 1))
		return
	fi
	for rule in "${rules[@]}"; do
		echo "HOLDS  $rule"
	done
	grep -oE '[0-9]+ distinct states found' "$dir/tlc.out" | tail -1
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

record_trust_at_unlock_start() {
	local file="$1"
	edit_model "$file" 'let enabledAtUnlockStart = false;' "let enabledAtUnlockStart = false;
let trustAtUnlockStart = 'disabled';" &&
		edit_model "$file" "	const trust = readTrustState();
	if (trust === 'disabled')" "	const trust = readTrustState();
	trustAtUnlockStart = trust;
	if (trust === 'disabled')"
}

mutant_count=0
expect_caught() {
	local rule="$1" mutation="$2" from="$3" to="$4"
	mutant_count=$((mutant_count + 1))
	local dir="$work/mutant-$mutant_count"
	local file="$dir/$model_file"
	mkdir -p "$dir"
	cp "$model" "$file"
	if ! edit_model "$file" "$from" "$to" || { [[ "$to" == *trustAtUnlockStart* ]] && ! record_trust_at_unlock_start "$file"; }; then
		echo "STALE  $rule: $mutation (target text not found in the model)"
		failures=$((failures + 1))
		return
	fi
	keep_only_rule "$rule" "$file"
	run_tlc "$dir"
	if is_broken "$rule" "$dir/tlc.out"; then
		echo "CAUGHT $rule: $mutation"
	elif grep -q 'Model checking completed. No error has been found.' "$dir/tlc.out"; then
		echo "MISSED $rule: $mutation"
		failures=$((failures + 1))
	else
		echo "ERROR  $rule: $mutation (output in $dir/tlc.out)"
		failures=$((failures + 1))
	fi
}

run_mutants() {
	expect_caught enabledOnlyWithConsent 'enableBiometry turns the flag on before the consent prompt' "	sentinel = 'bound';
	pc = 'enrolling';" "	sentinel = 'bound';
	enabled = true;
	pc = 'enrolling';"
	expect_caught noBiometricUnlockAfterTrustLoss 'Android biometryAuth skips the enrollment key check' "	if (!isEnrollmentValid()) return 'enrollmentChanged';
	return userSays;" '	return userSays;'
	expect_caught trustLossForcesPasscode 'getRelockReason forgets the relock marker once biometry is off' "finishRelockCheck('trustLost');" "finishRelockCheck('none');"
	expect_caught trustLossForcesPasscode 'invalidate turns the flag off and never writes the relock marker' '	if (step === 1) {
		pending = true;
		step = 2;' '	if (step === 1) {
		enabled = false;
		consented = false;
		step = 2;'
	expect_caught relockClearedOnlyAfterPasscode 'Outside the auto-lock window, a pending relock no longer hides the biometry button' "return trust === 'enabledRelockPending' || trust === 'disabledRelockPending' ? 'relockRequired' : 'none';" "return checkWithinWindow && pending ? 'relockRequired' : 'none';"
	expect_caught trustLossForcesPasscode 'getRelockReason uses the marker it read before the await' "	const trust = readTrustState();
	return trust === 'enabledRelockPending' || trust === 'disabledRelockPending' ? 'relockRequired' : 'none';" "	return trustAtUnlockStart === 'enabledRelockPending' ? 'relockRequired' : 'none';"
	expect_caught trustLossForcesPasscode 'The iOS invalidated sentinel still reads as present (the pinned OS assumption flipped)' 'const iosStaleSentinelVisible = false;' 'const iosStaleSentinelVisible = true;'
	expect_caught relockClearedOnlyAfterPasscode 'handleLocalAuthentication ignores the reason localAuthenticate handed it' 'openModalForReason(reasonForHandoff);' "openModalForReason('none');"
}

check_expected_holds
if [[ "${1-}" == --model ]]; then
	run_mutants
fi

exit $((failures > 0))
