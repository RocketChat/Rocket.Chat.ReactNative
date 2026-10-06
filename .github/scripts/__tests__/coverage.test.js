// Proves invariant (1) "no under-selection" against the REAL .sniffler/test-map.json
// and .sniffler/config.json: for each map-assertable diff in scenario-catalog.json
// (rows C1..C8), replicates sniffler's documented selection semantics in JS —
// root/ignore filtering, dependsOn glob matching, then flow -> test-N extraction
// the same way select-impacted-shards.sh does — and asserts the exact shard set.
// sniffler's own recommendation algorithm is trusted/out-of-scope; this only
// tests OUR map's globs and OUR config against real flow files on disk.
'use strict';

const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

const REPO_ROOT = path.resolve(__dirname, '../../..');

const config = require('../../../.sniffler/config.json');
const testMap = require('../../../.sniffler/test-map.json');
const catalog = require('./fixtures/scenario-catalog.json');

// Mirrors the grep pattern in select-impacted-shards.sh: `^\s*-\s*['"]?test-N`.
const TEST_N_PATTERN = /^[ \t]*-[ \t]*['"]?test-(\d+)/gm;

function extractShardsFromFlow(flowPath) {
	const contents = fs.readFileSync(path.join(REPO_ROOT, flowPath), 'utf8');
	const shards = new Set();
	let match;
	while ((match = TEST_N_PATTERN.exec(contents)) !== null) {
		shards.add(Number(match[1]));
	}
	return shards;
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
// dependsOn globs, then union the matched flows' `- test-N` tags.
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
		for (const shard of extractShardsFromFlow(flow)) shardSet.add(shard);
	}

	// Defensive: an impacted flow with no derivable tag must fall to full rather
	// than under-select (mirrors select-impacted-shards.sh's own fallback).
	if (shardSet.size === 0) {
		return { shards: fullShards, shouldRun: true };
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
