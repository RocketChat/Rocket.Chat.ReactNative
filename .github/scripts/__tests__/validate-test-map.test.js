// Tests for validate-test-map.js: each of the 5 checks is proven against a
// purpose-built fixture under testlib/fixtures/maps/<case>/ that triggers
// exactly that check, plus one fully-consistent fixture that passes clean.
// Fixtures live outside any __tests__ dir — jest's default testMatch
// collects every .js/.ts(x) file under __tests__ regardless of name, and the
// decoupled-gap / clean-pass fixtures need real app/sagas & app/stacks files.
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'validate-test-map.js');
const FIXTURES = path.join(__dirname, '..', 'testlib', 'fixtures', 'maps');

function runValidator(fixture) {
	const result = spawnSync('node', [SCRIPT], {
		encoding: 'utf8',
		env: { ...process.env, TESTMAP_ROOT: path.join(FIXTURES, fixture) }
	});
	return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('validate-test-map', () => {
	it('flags an orphan flow: test-N-tagged YAML with no test-map entry', () => {
		const { status, stdout } = runValidator('orphan-flow');
		expect(status).toBe(1);
		expect(stdout).toContain('::error file=.maestro/tests/orphan.yaml::Orphan flow');
	});

	it('flags a dangling glob: dependsOn glob matching zero files on disk', () => {
		const { status, stdout } = runValidator('dangling-glob');
		expect(status).toBe(1);
		expect(stdout).toContain('::error file=.sniffler/test-map.json::Dangling glob: "app/views/Nope/**"');
	});

	it('flags an uncovered view as a warning and exits 0', () => {
		const { status, stdout } = runValidator('uncovered-view');
		expect(status).toBe(0);
		expect(stdout).toContain('::warning file=app/views/SomeView::Uncovered view');
	});

	it('does not let a view dir prefix-match a longer covered dir (SomeView vs SomeViewExtra/**)', () => {
		const { status, stdout } = runValidator('prefix-collision');
		expect(status).toBe(0);
		expect(stdout).toContain('::warning file=app/views/SomeView::Uncovered view');
		expect(stdout).not.toContain('::warning file=app/views/SomeViewExtra::');
	});

	it('flags a stale runAllWhenChanged path missing on disk', () => {
		const { status, stdout } = runValidator('stale-global');
		expect(status).toBe(1);
		expect(stdout).toContain('::error file=app/nonexistent-global.txt::Stale global');
	});

	it('flags a decoupled gap: a saga file anchored in neither a dependsOn glob nor runAllWhenChanged', () => {
		const { status, stdout } = runValidator('decoupled-gap');
		expect(status).toBe(1);
		expect(stdout).toContain('::error file=app/sagas/foo.js::Decoupled gap');
	});

	it('passes clean when every flow, glob, view, and global lines up', () => {
		const { status, stdout } = runValidator('clean-pass');
		expect(status).toBe(0);
		expect(stdout).not.toContain('::error');
		expect(stdout).not.toContain('::warning');
		expect(stdout).toContain('All checks passed');
	});

	it('behaves identically with TESTMAP_ROOT unset (defaults to the real repo)', () => {
		const result = spawnSync('node', [SCRIPT], { encoding: 'utf8', env: process.env });
		expect(result.status).toBe(0);
	});
});
