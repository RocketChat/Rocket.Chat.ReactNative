// Tests for select-impacted-shards.sh: proves every uncertainty falls back to
// the full 14-shard suite (under-selection impossible) and that the
// confident-zero skip fires only on a genuinely empty impacted set.
// Expected values are read from scenario-catalog.json so this file stays in
// lockstep with the canonical matrix (rows F1, F2, F3, F4, F5, F5b, F6, F7, Z1).
'use strict';

const path = require('path');
const { runScript } = require('../testlib/runScript');
const catalog = require('./fixtures/scenario-catalog.json');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCRIPT = path.join(__dirname, '..', 'select-impacted-shards.sh');

const BASE_ENV = {
	BASE_REF: 'develop',
	HEAD_SHA: 'abc123',
	FULL_SHARDS: JSON.stringify(catalog.fullShards)
};

function findScenario(id) {
	const scenario = catalog.scenarios.find(s => s.id === id);
	if (!scenario) {
		throw new Error(`scenario ${id} not found in catalog`);
	}
	return scenario;
}

// git stub: fetch always succeeds; merge-base echoes a fake sha, or nothing
// when simulating the shallow-clone / unfetched-base fall-to-full case.
function gitStub(mergeBaseEmpty = false) {
	return `
case "$1" in
	fetch) exit 0 ;;
	merge-base)
		${mergeBaseEmpty ? 'echo ""' : 'echo deadbeef'}
		exit 0
		;;
	*) exit 0 ;;
esac
`;
}

// pnpm stub: only "exec sniffler" is intercepted (matches the script's real
// invocation shape); anything else exits 0 untouched.
function pnpmStub(json, exitCode = 0) {
	return `
if [ "$1 $2" = "exec sniffler" ]; then
	${json === null ? '' : `echo '${json}'`}
	exit ${exitCode}
fi
exit 0
`;
}

function expectScenario(result, scenario) {
	expect(result.status).toBe(0);
	expect(JSON.parse(result.shards)).toEqual(scenario.expectedShards);
	expect(result.should_run).toBe(String(scenario.expectedShouldRun));
}

describe('select-impacted-shards.sh', () => {
	describe('fall-to-full branches', () => {
		test('F1: release lane forces full suite', () => {
			const scenario = findScenario('F1');
			const result = runScript(SCRIPT, {
				env: { ...BASE_ENV, IS_RELEASE_LANE: 'true' },
				stubs: { git: gitStub(), pnpm: pnpmStub('{"recommendedTests":[]}') }
			});
			expectScenario(result, scenario);
		});

		test('F2: no base ref falls to full', () => {
			const scenario = findScenario('F2');
			const result = runScript(SCRIPT, {
				env: { ...BASE_ENV, BASE_REF: '' },
				stubs: { git: gitStub(), pnpm: pnpmStub('{"recommendedTests":[]}') }
			});
			expectScenario(result, scenario);
		});

		test('F3: merge-base empty falls to full', () => {
			const scenario = findScenario('F3');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(true), pnpm: pnpmStub('{"recommendedTests":[]}') }
			});
			expectScenario(result, scenario);
		});

		test('F4: sniffler nonzero exit falls to full', () => {
			const scenario = findScenario('F4');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(), pnpm: pnpmStub(null, 1) }
			});
			expectScenario(result, scenario);
		});

		test('F5: unparseable JSON falls to full', () => {
			const scenario = findScenario('F5');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(), pnpm: pnpmStub('not-json') }
			});
			expectScenario(result, scenario);
		});

		test('F5b: JSON missing recommendedTests key falls to full', () => {
			const scenario = findScenario('F5b');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(), pnpm: pnpmStub('{"other":true}') }
			});
			expectScenario(result, scenario);
		});

		test('F6: run-all reason falls to full', () => {
			const scenario = findScenario('F6');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: {
					git: gitStub(),
					pnpm: pnpmStub('{"recommendedTests":[{"test":"x","reasons":[{"kind":"run-all"}]}]}')
				}
			});
			expectScenario(result, scenario);
		});

		test('F7: impacted flow with no derivable test-N tag falls to full', () => {
			const scenario = findScenario('F7');
			const flowPath = path.join(REPO_ROOT, '.github/scripts/__tests__/fixtures/flows/no-tag.yaml');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: {
					git: gitStub(),
					pnpm: pnpmStub(`{"recommendedTests":[{"test":"${flowPath}"}]}`)
				}
			});
			expectScenario(result, scenario);
		});
	});

	describe('confident-zero', () => {
		test('Z1: exit 0 with no impacted flow skips the e2e stage', () => {
			const scenario = findScenario('Z1');
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(), pnpm: pnpmStub('{"recommendedTests":[]}') }
			});
			expectScenario(result, scenario);
		});
	});

	describe('happy path', () => {
		test('single impacted flow maps to its shard', () => {
			const flowPath = path.join(REPO_ROOT, '.maestro/tests/assorted/i18n.yaml'); // tags: test-6
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: {
					git: gitStub(),
					pnpm: pnpmStub(`{"recommendedTests":[{"test":"${flowPath}"}]}`)
				}
			});
			expect(result.status).toBe(0);
			expect(JSON.parse(result.shards)).toEqual([6]);
			expect(result.should_run).toBe('true');
		});

		test('multiple impacted flows map to the sorted unique shard union', () => {
			const flows = [
				path.join(REPO_ROOT, '.maestro/tests/assorted/i18n.yaml'), // test-6
				path.join(REPO_ROOT, '.maestro/tests/e2ee/e2e-encryption.yaml'), // test-3
				path.join(REPO_ROOT, '.maestro/tests/room/search.yaml') // test-13
			];
			const json = JSON.stringify({ recommendedTests: flows.map(test => ({ test })) });
			const result = runScript(SCRIPT, {
				env: BASE_ENV,
				stubs: { git: gitStub(), pnpm: pnpmStub(json) }
			});
			expect(result.status).toBe(0);
			expect(JSON.parse(result.shards)).toEqual([3, 6, 13]);
			expect(result.should_run).toBe('true');
		});
	});
});
