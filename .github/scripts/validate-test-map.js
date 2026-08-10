#!/usr/bin/env node
// Validates the sniffler test-map against the repo so it cannot silently rot.
// Five checks:
//   Orphan flow    ERROR   — a `test-N`-tagged YAML under .maestro/tests/ with
//                            no test-map entry (sniffler never selects it).
//   Dangling glob  ERROR   — a dependsOn glob that matches zero files on disk.
//   Uncovered view WARNING — an app/views/ directory no dependsOn glob anchors
//                            (a nudge; not every view needs a flow). `__*` dirs
//                            (Jest artifacts) are excluded.
//   Stale global   ERROR   — a runAllWhenChanged path missing on disk (never
//                            fires).
//   Decoupled gap  ERROR   — a saga or stack root neither anchored in a
//                            dependsOn glob nor in runAllWhenChanged (the
//                            import graph can't reach flows from it, so its
//                            changes would silently select zero flows).
// Emits GitHub Actions annotations + a summary; exits 1 on any error.

'use strict';

const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

const ROOT = process.env.TESTMAP_ROOT || path.resolve(__dirname, '..', '..');
const TEST_MAP_PATH = path.join(ROOT, '.sniffler', 'test-map.json');
const CONFIG_PATH = path.join(ROOT, '.sniffler', 'config.json');
const FLOWS_DIR = path.join(ROOT, '.maestro', 'tests');
const VIEWS_DIR = path.join(ROOT, 'app', 'views');

const ann = (level, file, msg) => console.log(`::${level} file=${file}::${msg}`);

let errorCount = 0;
let warnCount = 0;

const testMap = JSON.parse(fs.readFileSync(TEST_MAP_PATH, 'utf8'));
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Orphan flows: test-N-tagged YAML with no test-map entry.
const taggedFlows = fg
	.sync(['**/*.yaml', '**/*.yml'], { cwd: FLOWS_DIR, absolute: true })
	.filter(f => /^\s*-\s*['"]?test-\d+/m.test(fs.readFileSync(f, 'utf8')))
	.map(f => path.relative(ROOT, f).replace(/\\/g, '/'));

const mappedTests = new Set(testMap.map(e => e.test));
const orphans = taggedFlows.filter(f => !mappedTests.has(f));
for (const f of orphans) {
	ann('error', f, `Orphan flow: "${f}" has a test-N tag but no test-map entry — sniffler will never select it.`);
	errorCount++;
}

// Dangling dependsOn globs: zero matches on disk.
const dangling = [];
for (const entry of testMap) {
	for (const glob of entry.dependsOn || []) {
		if (fg.sync([glob], { cwd: ROOT }).length === 0) {
			ann('error', '.sniffler/test-map.json', `Dangling glob: "${glob}" in test "${entry.test}" resolves to zero files.`);
			dangling.push({ test: entry.test, glob });
			errorCount++;
		}
	}
}

// Uncovered views (WARNING): app/views/ dir no dependsOn glob anchors. Skip __* dirs.
const viewDirs = fs
	.readdirSync(VIEWS_DIR, { withFileTypes: true })
	.filter(d => d.isDirectory() && !d.name.startsWith('__'))
	.map(d => `app/views/${d.name}`);

const allDependsOn = testMap.flatMap(e => e.dependsOn || []);
const uncovered = viewDirs.filter(dir => !allDependsOn.some(g => g.startsWith(`${dir}/`)));
for (const dir of uncovered) {
	ann('warning', dir, `Uncovered view: "${dir}" has no dependsOn anchor in any test-map entry — new screen with no Maestro flow?`);
	warnCount++;
}

// Stale runAllWhenChanged paths: missing on disk. Entries may be globs (sniffler
// matches them as patterns), so a glob is fresh when it matches at least one file.
const runAll = config.tests?.runAllWhenChanged || [];
const isGlob = p => /[*?[\]{}]/.test(p);
const staleGlobals = runAll.filter(p =>
	isGlob(p) ? fg.sync(p, { cwd: ROOT, dot: true }).length === 0 : !fs.existsSync(path.join(ROOT, p))
);
for (const p of staleGlobals) {
	ann('error', p, `Stale global: "${p}" in runAllWhenChanged does not exist — will silently never fire.`);
	errorCount++;
}

// Decoupled gap (ERROR): sagas + stack roots are consumed via the store /
// navigator, so the import graph can't trace them to a flow. Each must be
// anchored in a dependsOn glob (domain) or listed in runAllWhenChanged (global).
const coveredByGlob = new Set(fg.sync(allDependsOn, { cwd: ROOT }));
const runAllSet = new Set(runAll);
const decoupledFiles = fg.sync(['app/sagas/*.{js,ts}', 'app/stacks/*.tsx', 'app/stacks/*/index.tsx'], {
	cwd: ROOT,
	ignore: ['**/__tests__/**']
});
const uncoveredDecoupled = decoupledFiles.filter(f => !coveredByGlob.has(f) && !runAllSet.has(f));
for (const f of uncoveredDecoupled) {
	ann('error', f, `Decoupled gap: "${f}" is neither anchored in a dependsOn glob nor in runAllWhenChanged — its changes would select zero flows.`);
	errorCount++;
}

console.log('\n── test-map freshness ──');
console.log(`  Flows scanned:    ${taggedFlows.length}`);
console.log(`  Test-map entries: ${testMap.length}`);
console.log(`  Orphans:          ${orphans.length}`);
console.log(`  Dangling globs:   ${dangling.length}`);
console.log(`  Uncovered views:  ${uncovered.length} (warnings)`);
console.log(`  Stale globals:    ${staleGlobals.length}`);
console.log(`  Decoupled gaps:   ${uncoveredDecoupled.length}`);

if (errorCount > 0) {
	console.log(`\n❌ ${errorCount} error(s), ${warnCount} warning(s).`);
	process.exit(1);
}
console.log(`\n✅ All checks passed (${warnCount} warning(s) allowed).`);
