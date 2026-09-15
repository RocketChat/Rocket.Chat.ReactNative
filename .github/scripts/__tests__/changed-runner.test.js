// Tests for e2e-changed.sh: the local `pnpm e2e:changed <android|ios>` runner.
// Unlike select-impacted-shards.sh, this script never writes to $GITHUB_OUTPUT —
// it is a pure CLI that gathers a CHANGED file set from git and execs straight
// into `pnpm exec sniffler run --changed ... -- maestro test ...`. Maestro is
// stubbed throughout: these tests prove the arg validation, the maestro guard,
// the merge-base fallback, and the CHANGED-gathering/invocation shape — actual
// Maestro flow execution needs a booted device and is out of scope here.
'use strict';

const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'e2e-changed.sh');

// No-op maestro: its presence alone satisfies the `command -v maestro` guard.
const MAESTRO_NOOP = 'exit 0';

// Records its own invocation to stdout so the trailing `maestro test ...`
// tail (once sniffler forwards to it) shows up in the captured process output.
const MAESTRO_RECORDING = `echo "MAESTRO_ARGS:$*"\nexit 0`;

// git stub: branches on the subcommand the script actually calls
// (merge-base / diff / ls-files). `mergeBase: null` simulates the
// unresolved-merge-base failure the script falls back on.
function gitStub({ mergeBase = 'deadbeef', diffFiles = [], untrackedFiles = [] } = {}) {
	const diffBody = diffFiles.map(f => `echo '${f}'`).join('\n\t\t') || ':';
	const untrackedBody = untrackedFiles.map(f => `echo '${f}'`).join('\n\t\t') || ':';
	return `
case "$1" in
	merge-base)
		${mergeBase === null ? 'exit 1' : `echo '${mergeBase}'`}
		;;
	diff)
		${diffBody}
		;;
	ls-files)
		${untrackedBody}
		;;
	*)
		exit 0
		;;
esac
`;
}

// pnpm stub: only intercepts `pnpm exec sniffler ...` (the script's real
// invocation shape). Echoes its own args (proves the --changed set / tail
// command sniffler received), then either reports a confident zero or execs
// the trailing `maestro test ...` command so it shows up in stdout too.
function pnpmStub({ zero = false } = {}) {
	return `
if [ "$1 $2" = "exec sniffler" ]; then
	echo "PNPM_ARGS:$*"
	if [ "${zero}" = "true" ]; then
		echo "sniffler: no impacted flows (confident zero)"
		exit 0
	fi
	while [ $# -gt 0 ] && [ "$1" != "--" ]; do
		shift
	done
	shift
	exec "$@"
fi
exit 0
`;
}

describe('e2e-changed.sh', () => {
	describe('platform arg validation', () => {
		test('missing platform arg prints usage and exits 2', () => {
			const result = runScript(SCRIPT, { args: [] });
			expect(result.status).toBe(2);
			expect(result.stderr).toContain('usage: pnpm e2e:changed <android|ios>');
		});

		test('invalid platform arg prints usage and exits 2', () => {
			const result = runScript(SCRIPT, { args: ['windows'] });
			expect(result.status).toBe(2);
			expect(result.stderr).toContain('usage: pnpm e2e:changed <android|ios>');
		});
	});

	describe('missing-maestro guard', () => {
		test('valid platform but no maestro on PATH fires the guard', () => {
			// Override PATH to a maestro-free set of dirs (no binDir stub either —
			// the guard fires before any git/sniffler call, so none is needed).
			const result = runScript(SCRIPT, {
				args: ['android'],
				env: { PATH: '/usr/bin:/bin:/opt/homebrew/bin' }
			});
			expect(result.status).toBe(2);
			expect(result.stderr).toContain('ERROR: maestro not found in PATH');
		});
	});

	describe('merge-base failure fallback', () => {
		test('unresolved merge-base against the default base exits 1 with an actionable error', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: { maestro: MAESTRO_NOOP, git: gitStub({ mergeBase: null }) }
			});
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("cannot resolve merge-base against 'origin/develop'");
			expect(result.stderr).toContain('set E2E_BASE');
		});

		test('E2E_BASE override is reflected in the failure message', () => {
			const result = runScript(SCRIPT, {
				args: ['ios'],
				env: { E2E_BASE: 'origin/custom-base' },
				stubs: { maestro: MAESTRO_NOOP, git: gitStub({ mergeBase: null }) }
			});
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("cannot resolve merge-base against 'origin/custom-base'");
		});
	});

	describe('CHANGED set gathering', () => {
		test('android: committed + uncommitted-tracked + untracked files are deduped, sorted, and forwarded to sniffler', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: {
					maestro: MAESTRO_RECORDING,
					git: gitStub({
						diffFiles: ['app/views/RoomView.tsx', 'app/actions/room.ts', 'app/actions/room.ts'],
						untrackedFiles: ['app/actions/room.ts', 'app/views/NewFeature.tsx']
					}),
					pnpm: pnpmStub()
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				'PNPM_ARGS:exec sniffler run --changed ' +
					'app/actions/room.ts app/views/NewFeature.tsx app/views/RoomView.tsx -- ' +
					'maestro test -e APP_ID=chat.rocket.android --exclude-tags=util --exclude-tags=ios-only'
			);
		});

		test('ios: platform selects the ios APP_ID and excludes android-only flows', () => {
			const result = runScript(SCRIPT, {
				args: ['ios'],
				stubs: {
					maestro: MAESTRO_RECORDING,
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub()
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				'PNPM_ARGS:exec sniffler run --changed app/views/RoomView.tsx -- ' +
					'maestro test -e APP_ID=chat.rocket.ios --exclude-tags=util --exclude-tags=android-only'
			);
		});

		test('sniffler forwards to maestro, which is invoked with the built command tail', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: {
					maestro: MAESTRO_RECORDING,
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub()
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				'MAESTRO_ARGS:test -e APP_ID=chat.rocket.android --exclude-tags=util --exclude-tags=ios-only'
			);
		});
	});

	describe('confident zero', () => {
		test('no changes at all vs base exits 0 cleanly without calling sniffler', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: { maestro: MAESTRO_NOOP, git: gitStub() }
				// no pnpm stub: if the script reached the exec line, the real (unstubbed)
				// pnpm would run and this test would fail or hang instead of passing.
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain('No changes vs origin/develop — nothing to run.');
			expect(result.stdout).not.toContain('PNPM_ARGS');
		});

		test('changes exist but sniffler reports no impacted flow: clean exit 0, maestro never runs', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: {
					maestro: MAESTRO_RECORDING,
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub({ zero: true })
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain('sniffler: no impacted flows (confident zero)');
			expect(result.stdout).not.toContain('MAESTRO_ARGS');
		});
	});
});
