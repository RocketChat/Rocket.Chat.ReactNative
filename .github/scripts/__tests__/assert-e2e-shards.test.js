'use strict';

const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'assert-e2e-shards.sh');

const pair = (file, tags) => ({ file, title: file, kind: 'test', tags, target: 'ios', disposition: 'run' });

const fullyTaggedPairs = Array.from({ length: 14 }, (_, index) => pair(`e2e/tests/shard-${index + 1}.e2e.ts`, [`test-${index + 1}`]));

function runWithListing(pairs) {
	return runScript(SCRIPT, { stubs: { pnpm: `echo '${JSON.stringify({ pairs })}'` } });
}

describe('assert-e2e-shards.sh', () => {
	test('fails on a test with no test-N tag even when every shard is covered', () => {
		const result = runWithListing([...fullyTaggedPairs, pair('e2e/tests/untagged.e2e.ts', ['smoke'])]);
		expect(result.status).toBe(1);
		expect(result.stdout).toContain('Tests with no test-<N> tag (never scheduled)');
		expect(result.stdout).toContain('e2e/tests/untagged.e2e.ts');
		expect(result.shards).toBeUndefined();
	});

	test('passes and emits 1..14 when every test is tagged and every shard is covered', () => {
		const result = runWithListing(fullyTaggedPairs);
		expect(result.status).toBe(0);
		expect(JSON.parse(result.shards)).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
	});
});
