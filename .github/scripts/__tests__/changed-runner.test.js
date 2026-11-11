// Tests for e2e-changed.sh: the local `pnpm e2e:changed <android|ios>` runner.
// Unlike select-impacted-shards.sh, this script never writes to $GITHUB_OUTPUT —
// it is a pure CLI that gathers a CHANGED file set from git and execs straight
// into `pnpm exec sniffler run --changed ... -- pnpm exec e2e run ...`. The e2e
// runner is stubbed throughout: these tests prove the arg validation, the
// merge-base fallback, and the CHANGED-gathering/invocation shape — actual test
// execution needs a booted device and is out of scope here.
'use strict';

const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'e2e-changed.sh');

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

// pnpm stub: intercepts `pnpm exec sniffler ...` (the script's real invocation
// shape). Echoes its own args (proves the --changed set / tail command sniffler
// received), then either reports a confident zero or execs the trailing
// `pnpm exec e2e run ...` command, which the stub records as E2E_ARGS.
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
if [ "$1 $2" = "exec e2e" ]; then
	shift 2
	echo "E2E_ARGS:$*"
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

	describe('merge-base failure fallback', () => {
		test('unresolved merge-base against the default base exits 1 with an actionable error', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: { git: gitStub({ mergeBase: null }) }
			});
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("cannot resolve merge-base against 'origin/develop'");
			expect(result.stderr).toContain('set E2E_BASE');
		});

		test('E2E_BASE override is reflected in the failure message', () => {
			const result = runScript(SCRIPT, {
				args: ['ios'],
				env: { E2E_BASE: 'origin/custom-base' },
				stubs: { git: gitStub({ mergeBase: null }) }
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
					'pnpm exec e2e run --target android'
			);
		});

		test('ios: platform selects the ios target', () => {
			const result = runScript(SCRIPT, {
				args: ['ios'],
				stubs: {
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub()
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				'PNPM_ARGS:exec sniffler run --changed app/views/RoomView.tsx -- ' +
					'pnpm exec e2e run --target ios'
			);
		});

		test('sniffler forwards to the e2e runner, which is invoked with the built command tail', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: {
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub()
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain(
				'E2E_ARGS:run --target android'
			);
		});
	});

	describe('confident zero', () => {
		test('no changes at all vs base exits 0 cleanly without calling sniffler', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: { git: gitStub() }
				// no pnpm stub: if the script reached the exec line, the real (unstubbed)
				// pnpm would run and this test would fail or hang instead of passing.
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain('No changes vs origin/develop — nothing to run.');
			expect(result.stdout).not.toContain('PNPM_ARGS');
		});

		test('changes exist but sniffler reports no impacted test: clean exit 0, the e2e runner never runs', () => {
			const result = runScript(SCRIPT, {
				args: ['android'],
				stubs: {
					git: gitStub({ diffFiles: ['app/views/RoomView.tsx'] }),
					pnpm: pnpmStub({ zero: true })
				}
			});
			expect(result.status).toBe(0);
			expect(result.stdout).toContain('sniffler: no impacted flows (confident zero)');
			expect(result.stdout).not.toContain('E2E_ARGS');
		});
	});
});
