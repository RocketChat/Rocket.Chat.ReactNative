#!/usr/bin/env bash
# Model-checks key distribution and client start against the recorded verdicts.
# No argument: one line per rule and per Jest replay. --model: the fix sketches and the mutants.
# Exit 0 only when every line matches the record. All tool output goes to a fresh mktemp -d.
set -uo pipefail

skill_dir="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$skill_dir" rev-parse --show-toplevel 2>/dev/null)"
work="$(mktemp -d)"
failures=0
runs=0

key_distribution_holds='noSkipByOtherSession'
key_distribution_broken='noStaleRoomHandshake noStaleWaitingUsersFetch noStaleKeyProvide stoppedHoldsNoRooms'
encryption_init_holds=''
encryption_init_broken='noStaleClientStart logoutForgetsKeys clientKeyMatchesUser serverKeysStayOwn'

report() {
	echo "$1"
	case "$1" in
	HOLDS* | BROKEN-AS-RECORDED* | CAUGHT*) ;;
	*) failures=$((failures + 1)) ;;
	esac
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

# variant <model> <from> <to> [<from> <to>]...: copies model/<model>.ts to a fresh folder with each replacement applied.
variant() {
	local model="$1"
	shift
	runs=$((runs + 1))
	variant_dir="$work/$runs-$model"
	mkdir -p "$variant_dir"
	model_file="$model.ts"
	cp "$skill_dir/model/$model.ts" "$variant_dir/"
	while [ $# -ge 2 ]; do
		if ! edit_model "$variant_dir/$model.ts" "$1" "$2"; then
			stale_target="$1"
			return 1
		fi
		shift 2
	done
}

# tlc <rules>: checks only these rules in the last variant; sets tlc_status and tlc_output.
tlc() {
	printf 'SPECIFICATION Spec\nCONSTANTS\n  Null = Null\nINVARIANTS %s\n' "$1" >"$variant_dir/rules.cfg"
	tlc_output="$variant_dir/tlc.out"
	(cd "$variant_dir" && pnpm dlx tla-ts@0.0.10 -config rules.cfg "$model_file" >"$tlc_output" 2>&1)
	tlc_status=$?
}

violated_rule() {
	grep -oE 'Invariant [A-Za-z]+ is violated' "$tlc_output" | head -1 | cut -d' ' -f2
}

tool_error() {
	echo "ERROR $1: tla-ts exited $tlc_status without a rule violation, see $tlc_output"
	failures=$((failures + 1))
}

# expect_rule_set <model> <rules>: the rules the model exports are the recorded ones.
expect_rule_set() {
	local model="$1" recorded="$2" generated
	generated="$(grep -h '^INVARIANTS' "$variant_dir"/[A-Z]*.cfg 2>/dev/null | head -1 | cut -d' ' -f2- | tr ' ' '\n' | sort | xargs)"
	recorded="$(echo "$recorded" | tr ' ' '\n' | sort | xargs)"
	if [ "$generated" != "$recorded" ]; then
		report "ERROR $model exports rules [$generated], the record has [$recorded]"
	fi
}

# expect_holds <label> <rules> <model> [<from> <to>]...
expect_holds() {
	local label="$1" rules="$2" model="$3"
	shift 3
	variant "$model" "$@" || {
		report "STALE  $label: target not found: $stale_target"
		return
	}
	tlc "$rules"
	if [ "$tlc_status" -eq 0 ]; then
		if [ -z "$label" ]; then
			for rule in $rules; do report "HOLDS  $rule"; done
		else
			report "HOLDS  every rule ($label)"
		fi
	elif [ "$tlc_status" -eq 12 ]; then
		report "NEW-BREAK $(violated_rule)${label:+ ($label)}"
	else
		tool_error "$model${label:+ ($label)}"
	fi
}

# expect_broken <rule> <model>: the code breaks this rule today.
expect_broken() {
	local rule="$1" model="$2"
	variant "$model"
	tlc "$rule"
	if [ "$tlc_status" -eq 12 ] && [ "$(violated_rule)" = "$rule" ]; then
		report "BROKEN-AS-RECORDED $rule"
	elif [ "$tlc_status" -eq 0 ]; then
		report "FIXED $rule"
	else
		tool_error "$model $rule"
	fi
}

# expect_caught <rules> <label> <model> [<from> <to>]...: the mutant breaks one of these rules.
expect_caught() {
	local rules="$1" label="$2" model="$3"
	shift 3
	variant "$model" "$@" || {
		report "STALE  $label: mutation target not found: $stale_target"
		return
	}
	tlc "$rules"
	if [ "$tlc_status" -eq 12 ]; then
		report "CAUGHT $(violated_rule) ($label)"
	elif [ "$tlc_status" -eq 0 ]; then
		report "MISSED $rules ($label)"
	else
		tool_error "$model ($label)"
	fi
}

check_rules() {
	expect_holds '' "$key_distribution_holds" keyDistribution
	expect_rule_set keyDistribution "$key_distribution_holds $key_distribution_broken"
	for rule in $key_distribution_broken; do expect_broken "$rule" keyDistribution; done
	for rule in $encryption_init_broken; do expect_broken "$rule" encryptionInit; done
	expect_rule_set encryptionInit "$encryption_init_holds $encryption_init_broken"
}

check_key_distribution_model() {
	local all="$key_distribution_holds $key_distribution_broken"
	local is_stale=('const flagOf = (handle: number) => handle;' 'const flagOf = (handle: number) => handle;

const isStale = (run: Run) => run.handle !== keyDistributionInterval;')
	local sample_loop=("	startHandshake(run);
	replaceRun(index, { ...run, step: 'Handshake'" "	if (isStale(run)) {
		afterSample(index, { ...run, found: false });
		return;
	}
	startHandshake(run);
	replaceRun(index, { ...run, step: 'Handshake'")
	local after_sample=('if (!run.found) {' 'if (isStale(run) || !run.found) {')
	local after_fetch=('if (!anyoneWaiting) {' 'if (isStale(run) || !anyoneWaiting) {')
	local after_encrypt=('if (!anyKeys) {' 'if (isStale(run) || !anyKeys) {')
	local fix=("${is_stale[@]}" "${sample_loop[@]}" "${after_sample[@]}" "${after_fetch[@]}" "${after_encrypt[@]}")

	expect_holds 'key distribution with the isStale checks of the fix' "$all" keyDistribution "${fix[@]}"
	expect_caught noStaleRoomHandshake 'fix without the getSample stale check' keyDistribution \
		"${is_stale[@]}" "${after_sample[@]}" "${after_fetch[@]}" "${after_encrypt[@]}"
	expect_caught noStaleWaitingUsersFetch 'fix without the stale check after getSample' keyDistribution \
		"${is_stale[@]}" "${sample_loop[@]}" "${after_fetch[@]}" "${after_encrypt[@]}"
	expect_caught noStaleRoomHandshake 'fix without the stale check after fetchUsersWaitingForGroupKey' keyDistribution \
		"${is_stale[@]}" "${sample_loop[@]}" "${after_sample[@]}" "${after_encrypt[@]}"
	expect_caught noStaleKeyProvide 'fix without the stale check after getSuggestedE2EEKeys' keyDistribution \
		"${is_stale[@]}" "${sample_loop[@]}" "${after_sample[@]}" "${after_fetch[@]}"
	expect_caught 'noStaleRoomHandshake noStaleWaitingUsersFetch noStaleKeyProvide' 'fix whose isStale only asks whether any interval is live' keyDistribution \
		"${fix[@]}" 'run.handle !== keyDistributionInterval' 'keyDistributionInterval === 0'
	expect_caught stoppedHoldsNoRooms 'fix whose stop keeps roomInstances' keyDistribution \
		"${fix[@]}" '	userId = null;
	initPendingFor = null;
	hasRoomInstances = false;' '	userId = null;
	initPendingFor = null;'
	expect_caught noSkipByOtherSession 'one distributing flag shared by every session' keyDistribution \
		'const flagOf = (handle: number) => handle;' 'const flagOf = (handle: number) => 0;'
	local three_sessions=('const MAX_SESSIONS = 2;' 'const MAX_SESSIONS = 3;' '[false, false, false]' '[false, false, false, false]')
	for action in queryResolves sampleHandshakeResolves waitingUsersResolve suggestedKeysResolve provideResolves; do
		three_sessions+=("$action = (index: 0 | 1" "$action = (index: 0 | 1 | 2")
	done
	expect_holds 'fix at three sessions' "$all" keyDistribution "${fix[@]}" "${three_sessions[@]}"
}

check_encryption_init_model() {
	local all="$encryption_init_holds $encryption_init_broken"
	local reselect_only=('	if (switchingTo === null) return;
	abortRequests();' '	if (switchingTo === null || connected !== null) return;
	abortRequests();' 'export const logoutStarts = () => {
	if (' 'export const logoutStarts = () => {
	if (logins >= 0) return;
	if (')
	local unscoped_rule=('export const noStaleClientStart = () => staleClientFor === null || (connected === staleClientFor && authenticated);' 'export const noStaleClientStart = () => staleClientFor === null;')
	local finish_guard=('	if (init === null) return;
	if (init.epoch !== epoch) {' '	if (init === null) return;
	if (init.epoch !== epoch) {
		init = null;
		return;
	}
	if (init.epoch !== epoch) {')
	local import_guard=('	const op = ops[index];
	clientKey = op.owner;' '	const op = ops[index];
	if (op.epoch !== epoch) {
		dropOp(index);
		if (op.awaited) {
			failInit();
		}
		return;
	}
	clientKey = op.owner;')
	local upload_guard=("if (target === null || serverKeys[target] !== 'None') {" "if (target === null || op.epoch !== epoch || serverKeys[target] !== 'None') {")

	expect_holds 'a switch that never connects: only the first connect, reselect before connect, no logout' "$all" encryptionInit \
		"${reselect_only[@]}"
	expect_caught noStaleClientStart 'same world, rule without its session scope: the reselect path is a stale start' encryptionInit \
		"${reselect_only[@]}" "${unscoped_rule[@]}"
	expect_holds 'init, import and upload drop work from an ended session' "$all" encryptionInit \
		"${finish_guard[@]}" "${import_guard[@]}" "${upload_guard[@]}"
	expect_holds 'import and upload guards alone: a stale op fails the saga before initialize' "$all" encryptionInit \
		"${import_guard[@]}" "${upload_guard[@]}"
	expect_caught 'logoutForgetsKeys clientKeyMatchesUser' 'fix without the import guard: a late import still writes' encryptionInit \
		"${finish_guard[@]}" "${upload_guard[@]}"
	expect_caught serverKeysStayOwn 'fix without the upload guard: a late upload still posts' encryptionInit \
		"${finish_guard[@]}" "${import_guard[@]}"
	expect_holds 'fix at four logins and three stops' "$all" encryptionInit \
		"${finish_guard[@]}" "${import_guard[@]}" "${upload_guard[@]}" \
		'const MAX_LOGINS = 3;' 'const MAX_LOGINS = 4;' 'const MAX_EPOCH = 2;' 'const MAX_EPOCH = 3;'
}

check_replays() {
	local jest="$repo/node_modules/.bin/jest" results="$work/replays.json"
	if [ ! -x "$jest" ]; then
		report "ERROR replays: $jest not found, run pnpm install"
		return
	fi
	(cd "$repo" && "$jest" --ci --no-watchman --rootDir "$repo" --roots "$skill_dir/replays" --modulePaths "$repo/node_modules" --testPathIgnorePatterns node_modules \
		--cacheDirectory "$work/jest-cache" --json --outputFile "$results" >"$work/replays.out" 2>&1)
	if [ ! -s "$results" ]; then
		report "ERROR replays: Jest wrote no results, see $work/replays.out"
		return
	fi
	while IFS= read -r line; do report "$line"; done < <(node -e '
		const rules = { "path 1": "noStaleClientStart", "path 2": "logoutForgetsKeys", "path 3": "serverKeysStayOwn", "path 4": "clientKeyMatchesUser" };
		const results = require(process.argv[1]);
		const tests = results.testResults.flatMap(file => file.assertionResults);
		if (tests.length !== 5) console.log(`ERROR replays: ${tests.length} tests ran, the record has 5`);
		for (const test of tests) {
			const rule = rules[test.title.slice(0, 6)] ?? "unknown rule";
			const verdict = test.status === "passed" ? "BROKEN-AS-RECORDED" : "FIXED";
			console.log(`${verdict} ${rule} (replay: ${test.title})`);
		}
	' "$results")
}

case "${1:-}" in
'')
	check_rules
	check_replays
	;;
--model)
	check_key_distribution_model
	check_encryption_init_model
	;;
*)
	echo "usage: $0 [--model]" >&2
	exit 2
	;;
esac

echo "tool output: $work"
exit $((failures > 0))
