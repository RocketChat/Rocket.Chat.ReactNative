#!/usr/bin/env bash
set -uo pipefail
skill_dir="$(cd "$(dirname "$0")" && pwd)"
tla_ts="tla-ts@0.0.10"
model="roomsListAnimations.ts"
rules="everyMountedRowEndsVisible toggleFadeOnlyInsideToggle reducedMotionSkipsFades"
work="$(mktemp -d)"
failures=0

run_model() {
	(cd "$1" && pnpm dlx "$tla_ts" "$model" 2>&1)
}

copy_model() {
	mkdir -p "$1"
	cp "$skill_dir/model/$model" "$1/$model"
}

keep_only() {
	local file="$1" keep="$2" rule
	for rule in $rules; do
		if [[ "$rule" != "$keep" ]]; then
			RULE="$rule" perl -0pi -e 's/^export const \Q$ENV{RULE}\E = \(\) =>\s.*?;$/export const $ENV{RULE} = () => true;/ms' "$file"
		fi
	done
}

copy_model "$work/rules"
output="$(run_model "$work/rules")"
if grep -q "No error has been found" <<<"$output"; then
	echo "PASS   roomsListAnimations rules ($(grep -oE '[0-9,]+ distinct states found' <<<"$output" | tail -1))"
else
	echo "FAIL   roomsListAnimations rules: $(grep -E 'is violated|Deadlock|Error' <<<"$output" | head -1)"
	failures=$((failures + 1))
fi

[[ "${1:-}" == "--mutants" ]] || exit $((failures > 0))

expect_broken() {
	local rule="$1" label="$2" dir="$work/mutant-$RANDOM"
	shift 2
	copy_model "$dir"
	while (($# >= 2)); do
		if ! FROM="$1" perl -0ne 'exit(index($_, $ENV{FROM}) < 0 ? 1 : 0)' "$dir/$model"; then
			echo "STALE  $rule ($label): mutation target not found: $1"
			failures=$((failures + 1))
			return
		fi
		FROM="$1" TO="$2" perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$dir/$model"
		shift 2
	done
	keep_only "$dir/$model" "$rule"
	if grep -qE "Invariant $rule is violated" <<<"$(run_model "$dir")"; then
		echo "CAUGHT $rule ($label)"
	else
		echo "MISSED $rule ($label)"
		failures=$((failures + 1))
	fi
}

expect_broken everyMountedRowEndsVisible "a row outside a toggle mounts at opacity 0 and nothing brings it back" \
	"	} else {
		shown[v] = 'opaque';" "	} else {
		shown[v] = 'transparent';"
expect_broken everyMountedRowEndsVisible "the reveal cover keeps opacity 1 after its delay" \
	"cover = coverEntering && isToggling ? 'covering' : 'hidden';" "cover = coverEntering && isToggling ? 'stuck' : 'hidden';"
expect_broken toggleFadeOnlyInsideToggle "fadesOnMount() ignores TOGGLE_SETTLE_MS, so a sync insert after a settled toggle fades in" \
	"const fadesOnMount = () => !reducedMotion && isToggling && toggleWindow !== 'elapsed';" "const fadesOnMount = () => !reducedMotion && isToggling;"
expect_broken toggleFadeOnlyInsideToggle "fadesOnMount() runs without a toggle, as every insert did before the 4.7 fix" \
	"const fadesOnMount = () => !reducedMotion && isToggling && toggleWindow !== 'elapsed';" "const fadesOnMount = () => !reducedMotion;"
expect_broken toggleFadeOnlyInsideToggle "fade() runs without a toggle, so a row leaving outside a toggle fades out" \
	"const fades = () => !reducedMotion && isToggling && toggleWindow === 'open';" "const fades = () => !reducedMotion;" \
	"const fadesOnMount = () => !reducedMotion && isToggling && toggleWindow !== 'elapsed';" "const fadesOnMount = () => !reducedMotion;"
expect_broken reducedMotionSkipsFades "fade() does not check useReducedMotion" \
	"if (!reducedMotion && isToggling && toggleWindow === 'unset')" "if (isToggling && toggleWindow === 'unset')" \
	"const fades = () => !reducedMotion && isToggling" "const fades = () => isToggling"
expect_broken reducedMotionSkipsFades "fadesOnMount() does not check useReducedMotion" \
	"const fadesOnMount = () => !reducedMotion && isToggling" "const fadesOnMount = () => isToggling"
expect_broken reducedMotionSkipsFades "coverEntering is passed under reduced motion" \
	"const coverEntering = !reducedMotion;" "const coverEntering = true;"

exit $((failures > 0))
