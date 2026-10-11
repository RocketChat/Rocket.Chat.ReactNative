// Proves invariant (1) "no under-selection" against the REAL .sniffler/test-map.json
// and .sniffler/config.json: for each map-assertable diff in scenario-catalog.json
// (rows C1..C8), replicates sniffler's documented selection semantics in JS —
// root/ignore filtering, dependsOn glob matching, then test -> test-N tags read
// from `e2e list` the same way select-impacted-shards.sh does — and asserts the
// exact shard set. sniffler's own recommendation algorithm is trusted/out-of-scope;
// this only tests OUR map's globs and OUR config against the real test tree.
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const micromatch = require('micromatch');

const REPO_ROOT = path.resolve(__dirname, '../../..');

const config = require('../../../.sniffler/config.json');
const testMap = require('../../../.sniffler/test-map.json');
const catalog = require('./fixtures/scenario-catalog.json');

const shardTagsByTest = new Map();
for (const { file, tags } of JSON.parse(
	execSync('pnpm exec e2e list --reporter json', { cwd: REPO_ROOT, encoding: 'utf8' })
).pairs) {
	const shards = tags.map(tag => tag.match(/^test-(\d+)$/)).filter(Boolean).map(match => Number(match[1]));
	shardTagsByTest.set(file, [...(shardTagsByTest.get(file) || []), shards]);
}

function shardsOfTest(testPath) {
	const pairShards = shardTagsByTest.get(testPath);
	if (!pairShards || pairShards.some(shards => shards.length === 0)) {
		return null;
	}
	return pairShards.flat();
}

function isUnderSourceRoots(diffPath) {
	return config.source.roots.some(root => micromatch.isMatch(diffPath, `${root}/**`));
}

function isIgnored(diffPath) {
	return config.source.ignore.some(glob => micromatch.isMatch(diffPath, glob));
}

function matchedFlowsFor(diffPath) {
	return testMap.filter(entry => entry.dependsOn.some(glob => micromatch.isMatch(diffPath, glob))).map(entry => entry.test);
}

// Replicates select-impacted-shards.sh's documented happy path against the real
// map: runAllWhenChanged -> full; else filter by source roots/ignore, match
// dependsOn globs, then union the matched tests' test-N tags; any untagged or unlisted test -> full.
function computeSelection(diffPaths) {
	const fullShards = [...catalog.fullShards].sort((a, b) => a - b);

	if (diffPaths.some(p => config.tests.runAllWhenChanged.includes(p))) {
		return { shards: fullShards, shouldRun: true };
	}

	const survivors = diffPaths.filter(p => isUnderSourceRoots(p) && !isIgnored(p));
	if (survivors.length === 0) {
		return { shards: [], shouldRun: false };
	}

	const matchedFlows = new Set(survivors.flatMap(matchedFlowsFor));
	if (matchedFlows.size === 0) {
		return { shards: [], shouldRun: false };
	}

	const shardSet = new Set();
	for (const flow of matchedFlows) {
		const shards = shardsOfTest(flow);
		if (shards === null) {
			return { shards: fullShards, shouldRun: true };
		}
		for (const shard of shards) shardSet.add(shard);
	}

	const shards = [...shardSet].sort((a, b) => a - b);
	return { shards, shouldRun: true };
}

describe('sniffler shard selection against the real .sniffler map', () => {
	const scenarios = catalog.scenarios.filter(s => s.assertableIn.includes('map'));

	test('catalog has map-assertable scenarios to run', () => {
		expect(scenarios.length).toBeGreaterThan(0);
	});

	test.each(scenarios)('$id: $name', scenario => {
		const { shards, shouldRun } = computeSelection(scenario.input.diff);
		expect(shards).toEqual(scenario.expectedShards);
		expect(shouldRun).toBe(scenario.expectedShouldRun);
	});
});
