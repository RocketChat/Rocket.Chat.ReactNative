import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { TLA_TS_ENTRY: tlaTsEntry, OUT_DIR: outputDirectory } = process.env;
if (!tlaTsEntry || !outputDirectory) {
	console.log('ERROR TLA_TS_ENTRY or OUT_DIR is not set; run this through check.sh');
	process.exit(2);
}
const { check, formatValue } = await import(pathToFileURL(tlaTsEntry).href);

const includesModelChecks = process.argv.includes('--model');
const modelDirectory = dirname(fileURLToPath(import.meta.url));
const baseSource = readFileSync(join(modelDirectory, 'LoginFetchOrdering.tla'), 'utf8');
const modes = ['sequential', 'parallel'];
const atomicCheck = process.env.ATOMIC_CHECK ?? 'TRUE';

const rules = ['VoipSessionMatchesAccess'];

const mutants = [
	{
		name: 'checkVoipPermission-awaits-io',
		atomicCheck: 'FALSE',
		caughtBy: 'VoipSessionMatchesAccess'
	},
	{
		name: 'takeLatest-ignores-ENTERPRISE_MODULES.SET',
		original: '/\\ Recheck(perms, serverModule)',
		replacement: '/\\ UNCHANGED <<session, checks>>',
		caughtBy: 'VoipSessionMatchesAccess'
	},
	{
		name: 'takeLatest-ignores-PERMISSIONS.SET',
		original: '/\\ Recheck(serverPerms, voipModule)',
		replacement: '/\\ UNCHANGED <<session, checks>>',
		caughtBy: 'VoipSessionMatchesAccess'
	}
];

const outcomeVariables = [
	'start',
	'serverPerms',
	'serverModule',
	'licenseAnswered',
	'perms',
	'voipModule',
	'modulesOwner',
	'session',
	'switched'
];

const withDefinitions = (source, definitions) =>
	source
		.replace('EXTENDS Naturals, Sequences', 'EXTENDS Naturals, Sequences, TLC')
		.replace(/\n=+\s*$/, `\n${definitions}\n====\n`);

const recordOutcome = 'RecordOutcome == Quiescent => PrintT(Outcome)';

const configFor = (mode, atomicCheck, invariantNames) =>
	[
		'CONSTANTS',
		`  Mode = "${mode}"`,
		`  AtomicCheck = ${atomicCheck}`,
		'SPECIFICATION Spec',
		...invariantNames.map(name => `INVARIANT ${name}`)
	].join('\n');

const describeTrace = trace =>
	trace
		.map((step, index) => {
			const changed = Object.entries(step.state)
				.filter(([name, value]) => index === 0 || formatValue(trace[index - 1].state[name]) !== formatValue(value))
				.map(([name, value]) => `${name}=${formatValue(value)}`)
				.join(' ');
			return `    ${index + 1}. ${step.action ?? 'Init'}: ${changed}`;
		})
		.join('\n');

const normalizeOutcome = text => text.replace(/\s+/g, ' ').trim();

let traceCount = 0;
const saveTrace = (label, trace) => {
	traceCount += 1;
	const file = join(outputDirectory, `trace-${traceCount}.txt`);
	writeFileSync(file, `${label}\n${describeTrace(trace)}\n`);
	return file;
};

let mismatches = 0;
let errors = 0;
const report = (verdict, label, detail = '') => {
	if (['NEW-BREAK', 'MISSED', 'STALE'].includes(verdict)) mismatches += 1;
	if (verdict === 'ERROR') errors += 1;
	console.log(`${verdict} ${label}${detail ? ` (${detail})` : ''}`);
};

const runChecker = async (source, config, onPrint) => {
	try {
		return await check({ source, config, onPrint });
	} catch (error) {
		return { status: 'exception', violation: undefined, distinctStates: 0, error };
	}
};

const checkRules = async mode => {
	const outcomes = new Set();
	const result = await runChecker(
		withDefinitions(baseSource, recordOutcome),
		configFor(mode, atomicCheck, [...rules, 'RecordOutcome']),
		text => outcomes.add(normalizeOutcome(text))
	);
	const prefix = mode;
	if (result.status === 'success') {
		for (const rule of rules) report('HOLDS', `${prefix} ${rule}`, `${result.distinctStates} distinct states`);
		return outcomes;
	}
	if (result.status === 'invariant-violation') {
		const rule = result.violation.name ?? rules.join('/');
		report('NEW-BREAK', `${prefix} ${rule}`, `shortest path in ${saveTrace(`${prefix} ${rule}`, result.violation.trace)}`);
		console.log(describeTrace(result.violation.trace));
		return undefined;
	}
	report('ERROR', `${prefix} ${rules.join('/')}`, `checker stopped with ${result.status} ${result.error ?? ''}`.trim());
	return undefined;
};

const compareOutcomes = async (sequentialOutcomes, parallelOutcomes) => {
	const label = 'outcome-comparison parallel-ends-only-where-sequential-can';
	if (!sequentialOutcomes || !parallelOutcomes) {
		report('SKIPPED', label, 'not compared: a rule run above did not finish');
		return;
	}
	const onlyParallel = [...parallelOutcomes].filter(outcome => !sequentialOutcomes.has(outcome));
	const onlySequential = [...sequentialOutcomes].filter(outcome => !parallelOutcomes.has(outcome));
	const counts = `sequential ${sequentialOutcomes.size}, parallel ${parallelOutcomes.size}, only parallel ${onlyParallel.length}, only sequential ${onlySequential.length}`;
	if (!onlyParallel.length && !onlySequential.length) {
		report('HOLDS', label, counts);
		return;
	}
	report('NEW-BREAK', label, counts);
	console.log(`    outcome = <<${outcomeVariables.join(', ')}>>`);
	for (const outcome of onlyParallel) console.log(`    only parallel: ${outcome}`);
	for (const outcome of onlySequential) console.log(`    only sequential: ${outcome}`);
	if (onlyParallel.length) {
		const witness = await runChecker(
			withDefinitions(baseSource, `SequentialOutcome == Quiescent => Outcome \\in {${[...sequentialOutcomes].join(', ')}}`),
			configFor('parallel', atomicCheck, ['SequentialOutcome'])
		);
		if (witness.violation) {
			console.log('    shortest parallel run that ends where sequential cannot:');
			console.log(describeTrace(witness.violation.trace));
		}
	}
};

const checkMutant = async ({ name, original, replacement, atomicCheck: mutantAtomicCheck = 'TRUE', caughtBy }) => {
	const occurrences = original ? baseSource.split(original).length - 1 : 1;
	if (occurrences !== 1) {
		report('STALE', `mutant ${name}`, `expected one "${original}" in the model, found ${occurrences}`);
		return;
	}
	const mutatedSource = original ? baseSource.replace(original, replacement) : baseSource;
	for (const mode of modes) {
		const result = await runChecker(mutatedSource, configFor(mode, mutantAtomicCheck, [caughtBy]));
		const label = `mutant ${name} ${mode}`;
		if (result.status === 'invariant-violation') report('CAUGHT', label, `${caughtBy} breaks`);
		else if (result.status === 'success') report('MISSED', label, `${caughtBy} still holds`);
		else report('ERROR', label, `checker stopped with ${result.status} ${result.error ?? ''}`.trim());
	}
};

const outcomesByMode = {};
for (const mode of modes) {
	outcomesByMode[mode] = await checkRules(mode);
}
await compareOutcomes(outcomesByMode.sequential, outcomesByMode.parallel);

if (includesModelChecks) {
	for (const mutant of mutants) await checkMutant(mutant);
}

process.exit(errors ? 2 : mismatches ? 1 : 0);
