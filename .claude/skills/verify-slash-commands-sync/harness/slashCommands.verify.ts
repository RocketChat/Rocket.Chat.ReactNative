type ServerMode =
	| { kind: 'paged'; defaultCount: number; upperLimit: number; allowInfiniteCount: boolean; answersAppsLoaded: boolean }
	| { kind: 'unpaged-without-total' };
type Failure =
	| { kind: 'none' }
	| { kind: 'throws' | 'success-false' | 'apps-not-loaded' | 'apps-not-loaded-without-success'; atRequest: number };
type ListChange =
	| 'stable'
	| 'command-added-after-first-request'
	| 'command-inserted-first-after-first-request'
	| 'first-command-removed-after-first-request'
	| 'other-instance-registration-order-after-first-request';
type InitialTable = 'empty' | 'all-outdated' | 'one-stale-plus-first-outdated';
type WorkspaceSwitch = { kind: 'none' } | { kind: 'switch'; duringRequest: number };

interface World {
	commandCount: number;
	server: ServerMode;
	failure: Failure;
	change: ListChange;
	initialTable: InitialTable;
	workspaceSwitch: WorkspaceSwitch;
}

interface StoredCommand {
	id: string;
	description?: string;
	params?: string;
	appId?: string;
}

interface Observation {
	requests: { offset?: number; count?: number; served: string }[];
	initialTable: Map<string, StoredCommand>;
	finalTable: Map<string, StoredCommand>;
	everOnServer: Set<string>;
	serverAtEnd: { command: string; description: string }[];
	runaway: boolean;
	timedOut: boolean;
	failureFired: boolean;
	changeFired: boolean;
	switchedDuringRequest?: number;
	otherWorkspaceTableBefore: Map<string, StoredCommand>;
	otherWorkspaceTableAfter: Map<string, StoredCommand>;
}

const MOCK_REQUEST_CAP = 60;
const RUN_TIMEOUT_MS = 3000;

const mockState: {
	world: World;
	serverCommands: { command: string; description: string; params: string }[];
	table: Map<string, StoredCommand>;
	otherWorkspaceTable: Map<string, StoredCommand>;
	activeWorkspace: 'started' | 'other';
	switchedDuringRequest?: number;
	requests: Observation['requests'];
	everOnServer: Set<string>;
	runaway: boolean;
	failureFired: boolean;
	changeFired: boolean;
} = {} as any;

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: () => undefined }));

jest.mock('~/lib/services/sdk', () => {
	const sortedAsRequested = (commands: { command: string }[], sort: string | undefined) => {
		if (!sort) {
			return commands;
		}
		const fields: [string, number][] = Object.entries(JSON.parse(sort));
		return [...commands].sort((left: any, right: any) => {
			for (const [field, direction] of fields) {
				if (left[field] > right[field]) {
					return direction;
				}
				if (left[field] < right[field]) {
					return -direction;
				}
			}
			return 0;
		});
	};
	const serve = (params: { offset?: number | string; count?: number | string; sort?: string } | undefined) => {
		const { world } = mockState;
		const requestNumber = mockState.requests.length + 1;
		if (requestNumber > MOCK_REQUEST_CAP) {
			mockState.runaway = true;
			return Promise.reject(new Error('RUNAWAY'));
		}
		if (requestNumber === 2 && world.change === 'command-added-after-first-request') {
			mockState.serverCommands.push({ command: 'z-late', description: 'late command', params: '' });
			mockState.everOnServer.add('z-late');
			mockState.changeFired = true;
		}
		if (requestNumber === 2 && world.change === 'command-inserted-first-after-first-request') {
			mockState.serverCommands.unshift({ command: 'a-early', description: 'early command', params: '' });
			mockState.everOnServer.add('a-early');
			mockState.changeFired = true;
		}
		if (requestNumber === 2 && world.change === 'first-command-removed-after-first-request') {
			mockState.changeFired = mockState.serverCommands.length > 0;
			mockState.serverCommands.shift();
		}
		const record = { offset: params?.offset as number | undefined, count: params?.count as number | undefined, served: '' };
		mockState.requests.push(record);
		const servingOtherWorkspace = mockState.activeWorkspace === 'other';
		if (world.workspaceSwitch.kind === 'switch' && world.workspaceSwitch.duringRequest === requestNumber) {
			mockState.activeWorkspace = 'other';
			mockState.switchedDuringRequest = requestNumber;
		}
		if (servingOtherWorkspace) {
			const otherCommands = [{ command: 'other0', description: 'other workspace', params: '' }];
			record.served = `other workspace's server: all ${otherCommands.length}`;
			return Promise.resolve({ success: true, commands: otherCommands, appsLoaded: true, offset: 0, count: 0, total: 0 });
		}
		if (world.failure.kind !== 'none' && world.failure.atRequest === requestNumber) {
			record.served = world.failure.kind;
			mockState.failureFired = true;
			if (world.failure.kind === 'throws') {
				return Promise.reject(new Error('network'));
			}
			if (world.failure.kind === 'apps-not-loaded') {
				return Promise.resolve({ success: true, commands: [], appsLoaded: false, offset: 0, count: 0, total: 0 });
			}
			if (world.failure.kind === 'apps-not-loaded-without-success') {
				return Promise.resolve({ commands: [], appsLoaded: false, offset: 0, count: 0, total: 0 });
			}
			return Promise.resolve({ success: false, error: 'error' });
		}
		const registered = mockState.serverCommands.map(command => ({ ...command }));
		if (requestNumber > 1 && world.change === 'other-instance-registration-order-after-first-request') {
			registered.reverse();
		}
		const all = sortedAsRequested(registered, params?.sort);
		if (world.server.kind === 'unpaged-without-total') {
			record.served = `all ${all.length}`;
			return Promise.resolve({ success: true, commands: all });
		}
		const { defaultCount, upperLimit, allowInfiniteCount } = world.server;
		const offset = params?.offset ? parseInt(String(params.offset), 10) : 0;
		let count = params?.count !== undefined ? parseInt(String(params.count || 0), 10) : defaultCount;
		if (count > upperLimit) {
			count = upperLimit;
		}
		if (count === 0 && !allowInfiniteCount) {
			count = defaultCount;
		}
		const page = count === 0 ? all.slice(offset) : all.slice(offset, offset + count);
		record.served = `[${page.map(command => command.command).join(',')}] total ${all.length}`;
		const appsLoaded = world.server.answersAppsLoaded ? { appsLoaded: true } : {};
		return Promise.resolve({ success: true, commands: page, ...appsLoaded, offset, count: page.length, total: all.length });
	};
	return {
		__esModule: true,
		default: {
			get: (endpoint: string, params: any) => {
				if (endpoint !== 'commands.list') {
					return Promise.reject(new Error(`unexpected endpoint ${endpoint}`));
				}
				return serve(params);
			}
		}
	};
});

jest.mock('~/lib/database', () => {
	const { sanitizedRaw } = jest.requireActual('@nozbe/watermelondb/RawRecord');
	const appSchema = jest.requireActual('~/lib/database/schema/app').default;
	const schema = appSchema.tables.slash_commands;
	const fields = ['description', 'params', 'appId', 'clientOnly', 'providesPreview'] as const;

	class FakeRecord {
		_raw: any;
		id!: string;

		constructor(stored?: StoredCommand) {
			if (stored) {
				this._raw = sanitizedRaw({ id: stored.id }, schema);
				Object.assign(this, stored);
			}
		}

		prepareUpdate(recordUpdater: (record: FakeRecord) => void) {
			const draft = new FakeRecord(this.snapshot());
			recordUpdater(draft);
			return { operation: 'update', id: this.id, draft };
		}

		prepareDestroyPermanently() {
			return { operation: 'destroy', id: this.id };
		}

		snapshot(): StoredCommand {
			const stored: StoredCommand = { id: this._raw?.id ?? this.id };
			fields.forEach(field => {
				if ((this as any)[field] !== undefined) {
					(stored as any)[field] = (this as any)[field];
				}
			});
			return stored;
		}
	}

	const workspaceDatabase = (tableKey: 'table' | 'otherWorkspaceTable') => {
		let writing = false;
		const collection = {
			schema,
			query: () => ({
				fetch: () => Promise.resolve([...mockState[tableKey].values()].map(stored => new FakeRecord(stored)))
			}),
			prepareCreate: (recordBuilder: (record: FakeRecord) => void) => {
				const draft = new FakeRecord();
				recordBuilder(draft);
				return { operation: 'create', id: draft._raw.id, draft };
			}
		};
		const active = {
			get: (table: string) => {
				if (table !== 'slash_commands') {
					throw new Error(`unexpected table ${table}`);
				}
				return collection;
			},
			write: async (writer: () => Promise<unknown>) => {
				if (writing) {
					throw new Error('nested write');
				}
				writing = true;
				try {
					return await writer();
				} finally {
					writing = false;
				}
			},
			batch: (...args: any[]) => {
				if (!writing) {
					return Promise.reject(new Error('batch outside write'));
				}
				const operations = (Array.isArray(args[0]) ? args[0] : args).flat().filter(Boolean);
				const next = new Map(mockState[tableKey]);
				for (const operation of operations) {
					if (operation.operation === 'create') {
						if (next.has(operation.id)) {
							return Promise.reject(new Error(`duplicate id ${operation.id}`));
						}
						next.set(operation.id, operation.draft.snapshot());
					} else if (operation.operation === 'update') {
						next.set(operation.id, { ...operation.draft.snapshot(), id: operation.id });
					} else if (operation.operation === 'destroy') {
						next.delete(operation.id);
					}
				}
				mockState[tableKey] = next;
				return Promise.resolve();
			}
		};
		return active;
	};
	const startedWorkspace = workspaceDatabase('table');
	const otherWorkspace = workspaceDatabase('otherWorkspaceTable');
	return {
		__esModule: true,
		default: {
			get active() {
				return mockState.activeWorkspace === 'other' ? otherWorkspace : startedWorkspace;
			}
		}
	};
});

const serverModes: ServerMode[] = [
	{ kind: 'paged', defaultCount: 2, upperLimit: 2, allowInfiniteCount: false, answersAppsLoaded: true },
	{ kind: 'paged', defaultCount: 2, upperLimit: 4, allowInfiniteCount: false, answersAppsLoaded: true },
	{ kind: 'paged', defaultCount: 3, upperLimit: 5, allowInfiniteCount: true, answersAppsLoaded: true },
	{ kind: 'paged', defaultCount: 1, upperLimit: 3, allowInfiniteCount: false, answersAppsLoaded: true },
	{ kind: 'paged', defaultCount: 2, upperLimit: 4, allowInfiniteCount: false, answersAppsLoaded: false },
	{ kind: 'unpaged-without-total' }
];
const failures: Failure[] = [
	{ kind: 'none' },
	...[1, 2, 3].flatMap(atRequest => [
		{ kind: 'throws' as const, atRequest },
		{ kind: 'success-false' as const, atRequest },
		{ kind: 'apps-not-loaded' as const, atRequest },
		{ kind: 'apps-not-loaded-without-success' as const, atRequest }
	])
];
const changes: ListChange[] = [
	'stable',
	'command-added-after-first-request',
	'command-inserted-first-after-first-request',
	'first-command-removed-after-first-request',
	'other-instance-registration-order-after-first-request'
];
const initialTables: InitialTable[] = ['empty', 'all-outdated', 'one-stale-plus-first-outdated'];
const workspaceSwitches: WorkspaceSwitch[] = [
	{ kind: 'none' },
	{ kind: 'switch', duringRequest: 1 },
	{ kind: 'switch', duringRequest: 2 }
];
const otherWorkspaceTableBefore = () =>
	new Map<string, StoredCommand>([['other-stored', { id: 'other-stored', description: 'other workspace' }]]);
const MAX_COMMANDS = Number(process.env.SC_MAX_COMMANDS ?? 7);

const commandName = (index: number) => `c${index}`;

const initialTableFor = (world: World) => {
	const table = new Map<string, StoredCommand>();
	if (world.initialTable === 'all-outdated') {
		for (let index = 0; index < world.commandCount; index++) {
			table.set(commandName(index), { id: commandName(index), description: 'outdated' });
		}
	}
	if (world.initialTable === 'one-stale-plus-first-outdated') {
		table.set('stale', { id: 'stale', description: 'uninstalled app' });
		if (world.commandCount > 0) {
			table.set(commandName(0), { id: commandName(0), description: 'outdated' });
		}
	}
	return table;
};

const runWorld = async (world: World): Promise<Observation> => {
	const serverCommands = Array.from({ length: world.commandCount }, (_, index) => ({
		command: commandName(index),
		description: `current ${index}`,
		params: ''
	}));
	const initialTable = initialTableFor(world);
	Object.assign(mockState, {
		world,
		serverCommands,
		table: new Map(initialTable),
		otherWorkspaceTable: otherWorkspaceTableBefore(),
		activeWorkspace: 'started',
		switchedDuringRequest: undefined,
		requests: [],
		everOnServer: new Set(serverCommands.map(command => command.command)),
		runaway: false,
		failureFired: false,
		changeFired: false
	});
	const { getSlashCommands } = require('~/lib/methods/getSlashCommands');
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timedOut = await Promise.race([
		Promise.resolve(getSlashCommands()).then(
			() => false,
			() => false
		),
		new Promise<boolean>(resolve => {
			timer = setTimeout(() => resolve(true), RUN_TIMEOUT_MS);
		})
	]);
	clearTimeout(timer);
	return {
		requests: mockState.requests,
		initialTable,
		finalTable: mockState.table,
		everOnServer: mockState.everOnServer,
		serverAtEnd: mockState.serverCommands,
		runaway: mockState.runaway,
		timedOut,
		failureFired: mockState.failureFired,
		changeFired: mockState.changeFired,
		switchedDuringRequest: mockState.switchedDuringRequest,
		otherWorkspaceTableBefore: otherWorkspaceTableBefore(),
		otherWorkspaceTableAfter: mockState.otherWorkspaceTable
	};
};

const sameTable = (left: Map<string, StoredCommand>, right: Map<string, StoredCommand>) =>
	left.size === right.size &&
	[...left].every(([id, stored]) => right.has(id) && JSON.stringify(right.get(id)) === JSON.stringify(stored));

const holdsExactlyServerCommands = (seen: Observation) =>
	seen.finalTable.size === seen.serverAtEnd.length &&
	seen.serverAtEnd.every(command => seen.finalTable.get(command.command)?.description === command.description);

const holdsOnlyServerCommands = (seen: Observation) =>
	[...seen.finalTable.keys()].every(id => seen.everOnServer.has(id)) &&
	seen.serverAtEnd.every(command => {
		const stored = seen.finalTable.get(command.command);
		return !stored || stored.description === command.description;
	});

type Rule = { name: string; applies: (seen: Observation) => boolean; holds: (world: World, seen: Observation) => boolean };

const rules: Rule[] = [
	{
		name: 'completeSync',
		applies: seen => !seen.failureFired && !seen.changeFired && seen.switchedDuringRequest === undefined,
		holds: (_world, seen) => holdsExactlyServerCommands(seen)
	},
	{
		name: 'failureKeepsTable',
		applies: seen => seen.failureFired,
		holds: (_world, seen) => sameTable(seen.initialTable, seen.finalTable)
	},
	{
		name: 'terminates',
		applies: () => true,
		holds: (_world, seen) => !seen.runaway && !seen.timedOut
	},
	{
		name: 'changingListKeepsOnlyServerCommands',
		applies: seen => !seen.failureFired && seen.changeFired && seen.switchedDuringRequest === undefined,
		holds: (_world, seen) => holdsOnlyServerCommands(seen)
	},
	{
		name: 'workspaceSwitchSavesOnlyIntoStartingWorkspace',
		applies: seen => seen.switchedDuringRequest !== undefined,
		holds: (_world, seen) =>
			seen.requests.length === seen.switchedDuringRequest &&
			sameTable(seen.otherWorkspaceTableBefore, seen.otherWorkspaceTableAfter) &&
			(sameTable(seen.initialTable, seen.finalTable) ||
				(!seen.failureFired && (seen.changeFired ? holdsOnlyServerCommands(seen) : holdsExactlyServerCommands(seen))))
	}
];

const describeWorld = (world: World) => {
	const server =
		world.server.kind === 'paged'
			? `server pages commands.list with API_Default_Count=${world.server.defaultCount}, API_Upper_Count_Limit=${world.server.upperLimit}, API_Allow_Infinite_Count=${world.server.allowInfiniteCount}${world.server.answersAppsLoaded ? '' : ', no appsLoaded field (server 8.0 or older)'}`
			: 'server ignores offset/count and returns every command with no total';
	const failure = world.failure.kind === 'none' ? 'no request fails' : `request ${world.failure.atRequest} ${world.failure.kind}`;
	const workspaceSwitch =
		world.workspaceSwitch.kind === 'none'
			? 'no workspace switch'
			: `database.active switches to another workspace while request ${world.workspaceSwitch.duringRequest} is in flight`;
	return `${world.commandCount} commands on the server; ${server}; ${failure}; list ${world.change}; local table starts ${world.initialTable}; ${workspaceSwitch}`;
};

const describeRun = (world: World, seen: Observation) => {
	const lines = [`  world: ${describeWorld(world)}`];
	lines.push(`  1. local slash_commands holds [${[...seen.initialTable.keys()].join(',')}]`);
	seen.requests.forEach((request, index) => {
		lines.push(
			`  ${index + 2}. getSlashCommands → GET commands.list offset=${request.offset ?? '(none)'} count=${request.count ?? '(none)'} → ${request.served}`
		);
	});
	if (seen.runaway) {
		lines.push(`  … still requesting after ${MOCK_REQUEST_CAP} requests`);
	}
	if (seen.timedOut) {
		lines.push(`  … getSlashCommands had not resolved after ${RUN_TIMEOUT_MS} ms`);
	}
	if (seen.switchedDuringRequest !== undefined) {
		lines.push(
			`  other workspace's slash_commands went from [${[...seen.otherWorkspaceTableBefore.keys()].join(',')}] to [${[
				...seen.otherWorkspaceTableAfter.keys()
			].join(',')}]`
		);
	}
	lines.push(
		`  ${seen.requests.length + 2}. local slash_commands ends [${[...seen.finalTable.values()]
			.map(stored => `${stored.id}:${stored.description}`)
			.join(', ')}]; server holds [${seen.serverAtEnd.map(command => command.command).join(',')}]`
	);
	return lines.join('\n');
};

const serverCanAnswer = (server: ServerMode, failure: Failure) =>
	(failure.kind !== 'apps-not-loaded' && failure.kind !== 'apps-not-loaded-without-success') ||
	server.kind !== 'paged' ||
	server.answersAppsLoaded;

const worlds = (): World[] => {
	const all: World[] = [];
	for (let commandCount = 0; commandCount <= MAX_COMMANDS; commandCount++) {
		for (const server of serverModes) {
			for (const failure of failures) {
				if (!serverCanAnswer(server, failure)) {
					continue;
				}
				for (const change of changes) {
					for (const initialTable of initialTables) {
						for (const workspaceSwitch of workspaceSwitches) {
							all.push({ commandCount, server, failure, change, initialTable, workspaceSwitch });
						}
					}
				}
			}
		}
	}
	return all;
};

it('getSlashCommands keeps slash_commands equal to the server command set', async () => {
	const failing = new Map<string, { world: World; seen: Observation }[]>();
	rules.forEach(rule => failing.set(rule.name, []));
	const allWorlds = worlds();
	for (const world of allWorlds) {
		const seen = await runWorld(world);
		for (const rule of rules) {
			if (rule.applies(seen) && !rule.holds(world, seen)) {
				failing.get(rule.name)!.push({ world, seen });
			}
		}
	}
	const counts: Record<string, number> = {};
	const report: string[] = [`checked ${allWorlds.length} runs`];
	for (const rule of rules) {
		const broken = failing.get(rule.name)!;
		counts[rule.name] = broken.length;
		if (!broken.length) {
			report.push(`HOLDS ${rule.name}`);
			continue;
		}
		const byLength = [...broken].sort(
			(left, right) =>
				left.seen.requests.length - right.seen.requests.length || left.world.commandCount - right.world.commandCount
		);
		const [shortest] = byLength;
		report.push(`BROKEN ${rule.name} (${broken.length} failing runs); shortest:\n${describeRun(shortest.world, shortest.seen)}`);
		const shortestWithCommands = byLength.find(run => run.world.commandCount > 0);
		if (shortestWithCommands && shortestWithCommands !== shortest) {
			report.push(
				`  shortest with commands on the server:\n${describeRun(shortestWithCommands.world, shortestWithCommands.seen)}`
			);
		}
	}
	report.push(`SC_RESULT ${JSON.stringify(counts)}`);
	process.stdout.write(`${report.join('\n')}\n`);
	expect(Object.values(counts).every(count => count === 0)).toBe(true);
});
