import { getSettings } from '~/lib/methods/getSettings';
import { _prepareSettings } from '~/lib/methods/parseSettings';
import log from '~/lib/methods/helpers/log';
import { store as reduxStore } from '~/lib/store/auxStore';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: { get: jest.fn(), write: jest.fn(() => Promise.resolve()) },
		servers: { get: jest.fn(), write: jest.fn() }
	}
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {}
}));

jest.mock('~/lib/methods/getUsersPresence', () => ({
	setPresenceCap: jest.fn()
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		dispatch: jest.fn(),
		getState: jest.fn(() => ({ server: { version: '7.0.0' } }))
	}
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/methods/parseSettings', () => {
	const actual = jest.requireActual('~/lib/methods/parseSettings');
	return { ...actual, _prepareSettings: jest.fn(actual._prepareSettings) };
});

interface ISettingStub {
	_id: string;
}

interface ISettingsPage {
	success: boolean;
	settings: ISettingStub[];
	total: number;
}

type FakeServer = (offset: number) => Promise<ISettingsPage>;

type FetchOutcome =
	| { kind: 'settings'; ids: string[] }
	| { kind: 'aborted' }
	| { kind: 'rejected' }
	| { kind: 'iteration cap hit' };

const SERVER = 'https://settings.example';
const OLD_LOOP_ITERATION_CAP = 1000;
const GENERATED_CASE_COUNT = 400;
const MAX_SETTING_COUNT = 250;
const MAX_PAGE_SIZE = 120;
const DEFAULT_SEED = 0x5e771665;
const BOUNDARY_CASES: [settingCount: number, pageSize: number][] = [
	[0, 1],
	[0, MAX_PAGE_SIZE],
	[1, 1],
	[1, MAX_PAGE_SIZE],
	[MAX_PAGE_SIZE, MAX_PAGE_SIZE],
	[MAX_PAGE_SIZE + 1, MAX_PAGE_SIZE],
	[MAX_PAGE_SIZE * 2, MAX_PAGE_SIZE],
	[MAX_SETTING_COUNT, 1],
	[MAX_SETTING_COUNT, MAX_PAGE_SIZE]
];

const prepareSettingsSpy = _prepareSettings as jest.Mock;

function mulberry32(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
		mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
		return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
	};
}

const randomIntInclusive = (random: () => number, min: number, max: number) => min + Math.floor(random() * (max - min + 1));

const createSettingList = (settingCount: number): ISettingStub[] =>
	Array.from({ length: settingCount }, (_, index) => ({
		_id: `Generated_Setting_${index}`
	}));

const createContractServer =
	(settingList: ISettingStub[], pageSize: number): FakeServer =>
	offset =>
		Promise.resolve({
			success: true,
			settings: settingList.slice(offset, offset + pageSize),
			total: settingList.length
		});

async function fetchWithOldSequentialLoop(server: FakeServer): Promise<FetchOutcome> {
	let offset = 0;
	let remaining;
	let settings: ISettingStub[] = [];
	let iterations = 0;
	try {
		do {
			if (iterations >= OLD_LOOP_ITERATION_CAP) {
				return { kind: 'iteration cap hit' };
			}
			iterations += 1;
			const result = await server(offset);
			if (!result.success) {
				return { kind: 'aborted' };
			}
			offset += result.settings.length;
			settings = [...settings, ...result.settings];
			remaining = result.total - settings.length;
		} while (remaining > 0);
	} catch {
		return { kind: 'rejected' };
	}
	return { kind: 'settings', ids: settings.map(setting => setting._id) };
}

let currentServer: FakeServer = createContractServer([], 1);

const offsetFromUrl = (url: string) => Number(new URL(url).searchParams.get('offset'));

const sentToNetwork = mockGlobalFetch(async url => {
	const page = await currentServer(offsetFromUrl(url));
	return { json: () => Promise.resolve(page) } as Response;
});

async function runRealGetSettings(server: FakeServer) {
	currentServer = server;
	sentToNetwork.mockClear();
	prepareSettingsSpy.mockClear();
	(log as jest.Mock).mockClear();
	(reduxStore.dispatch as jest.Mock).mockClear();

	await getSettings(SERVER);

	const preparedInputs = prepareSettingsSpy.mock.calls.map(([settings]) =>
		(settings as ISettingStub[]).map(setting => setting._id)
	);
	return {
		requestedOffsets: sentToNetwork.mock.calls.map(([url]) => offsetFromUrl(url)),
		preparedIds: preparedInputs.length ? preparedInputs[0] : undefined,
		dispatchCount: (reduxStore.dispatch as jest.Mock).mock.calls.length,
		loggedErrors: (log as jest.Mock).mock.calls.map(([error]) => error)
	};
}

describe('getSettings pagination against a server that honours the settings.public contract', () => {
	it(`matches the old sequential loop on ${BOUNDARY_CASES.length} boundary and ${GENERATED_CASE_COUNT} generated (setting count, page size) pairs`, async () => {
		const seed = Number(process.env.SETTINGS_PAGINATION_SEED ?? DEFAULT_SEED);
		const random = mulberry32(seed);
		const failures: string[] = [];

		const generatedCases = Array.from({ length: GENERATED_CASE_COUNT }, () => [
			randomIntInclusive(random, 0, MAX_SETTING_COUNT),
			randomIntInclusive(random, 1, MAX_PAGE_SIZE)
		]);
		const allCases = [...BOUNDARY_CASES, ...generatedCases];

		for (let caseIndex = 0; caseIndex < allCases.length; caseIndex += 1) {
			const [settingCount, pageSize] = allCases[caseIndex];
			const server = createContractServer(createSettingList(settingCount), pageSize);
			const caseLabel = `seed=${seed} case=${caseIndex} settingCount=${settingCount} pageSize=${pageSize}`;

			const oldOutcome = await fetchWithOldSequentialLoop(server);
			const { requestedOffsets, preparedIds, loggedErrors } = await runRealGetSettings(server);

			const expectedRequestCount = Math.max(1, Math.ceil(settingCount / pageSize));
			const distinctOffsets = new Set(requestedOffsets);

			if (oldOutcome.kind !== 'settings' || JSON.stringify(preparedIds) !== JSON.stringify(oldOutcome.ids)) {
				failures.push(`${caseLabel}: ids differ from old loop (${oldOutcome.kind}, got ${preparedIds?.length ?? 'none'})`);
			}
			if (requestedOffsets.length !== expectedRequestCount) {
				failures.push(`${caseLabel}: ${requestedOffsets.length} requests, expected ${expectedRequestCount}`);
			}
			if (distinctOffsets.size !== requestedOffsets.length) {
				failures.push(`${caseLabel}: repeated offsets ${requestedOffsets.join(',')}`);
			}
			if (requestedOffsets.some(offset => offset % pageSize !== 0)) {
				failures.push(`${caseLabel}: offset not a multiple of page size ${requestedOffsets.join(',')}`);
			}
			if (loggedErrors.length) {
				failures.push(`${caseLabel}: logged ${String(loggedErrors[0])}`);
			}
		}

		expect(failures).toEqual([]);
	});
});

describe('getSettings pagination against a server that breaks the settings.public contract', () => {
	const settingList = createSettingList(10);
	const allIds = settingList.map(setting => setting._id);

	it('drops the settings a short middle page left out, where the old loop re-requested from the shortened offset and got all of them', async () => {
		const pageSize = 4;
		const shortenedOffset = 4;
		const server: FakeServer = offset =>
			Promise.resolve({
				success: true,
				settings: settingList.slice(offset, offset + (offset === shortenedOffset ? pageSize - 1 : pageSize)),
				total: settingList.length
			});

		const oldOutcome = await fetchWithOldSequentialLoop(server);
		const { requestedOffsets, preparedIds } = await runRealGetSettings(server);

		expect(oldOutcome).toEqual({ kind: 'settings', ids: allIds });
		expect(requestedOffsets).toEqual([0, 4, 8]);
		expect(preparedIds).toEqual(allIds.filter(id => id !== 'Generated_Setting_7'));
	});

	it('saves an empty settings list after one request when the first page is empty but total is positive, where the old loop never stops', async () => {
		const server: FakeServer = () =>
			Promise.resolve({
				success: true,
				settings: [],
				total: settingList.length
			});

		const oldOutcome = await fetchWithOldSequentialLoop(server);
		const { requestedOffsets, preparedIds, dispatchCount } = await runRealGetSettings(server);

		expect(oldOutcome).toEqual({ kind: 'iteration cap hit' });
		expect(requestedOffsets).toEqual([0]);
		expect(preparedIds).toEqual([]);
		expect(dispatchCount).toBe(1);
	});

	it('requests every page and then saves nothing when a later page fails, where the old loop stopped requesting at the failed page', async () => {
		const pageSize = 2;
		const failingOffset = 4;
		const contractServer = createContractServer(settingList, pageSize);
		const server: FakeServer = offset =>
			offset === failingOffset ? Promise.resolve({ success: false, settings: [], total: 0 }) : contractServer(offset);

		const oldRequestedOffsets: number[] = [];
		const oldOutcome = await fetchWithOldSequentialLoop(offset => {
			oldRequestedOffsets.push(offset);
			return server(offset);
		});
		const { requestedOffsets, preparedIds, dispatchCount, loggedErrors } = await runRealGetSettings(server);

		expect(oldOutcome).toEqual({ kind: 'aborted' });
		expect(oldRequestedOffsets).toEqual([0, 2, 4]);
		expect(requestedOffsets).toEqual([0, 2, 4, 6, 8]);
		expect(preparedIds).toBeUndefined();
		expect(dispatchCount).toBe(0);
		expect(loggedErrors).toEqual([]);
	});

	it('logs the error and saves nothing when a later page request rejects, the same outcome as the old loop', async () => {
		const pageSize = 2;
		const rejectingOffset = 4;
		const networkError = new Error('Network request failed');
		const contractServer = createContractServer(settingList, pageSize);
		const server: FakeServer = offset => (offset === rejectingOffset ? Promise.reject(networkError) : contractServer(offset));

		const oldOutcome = await fetchWithOldSequentialLoop(server);
		const { requestedOffsets, preparedIds, dispatchCount, loggedErrors } = await runRealGetSettings(server);

		expect(oldOutcome).toEqual({ kind: 'rejected' });
		expect(requestedOffsets).toEqual([0, 2, 4, 6, 8]);
		expect(preparedIds).toBeUndefined();
		expect(dispatchCount).toBe(0);
		expect(loggedErrors).toEqual([networkError]);
	});
});
