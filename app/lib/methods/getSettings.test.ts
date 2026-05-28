import { getLoginSettings, getSettings } from './getSettings';
import { initStore } from '../store/auxStore';
import { mockedStore } from '../../reducers/mockedStore';
import { selectServerClear, selectServerRequest } from '../../actions/server';
import fetch from './helpers/fetch';

const STALE_SDK_HOST = 'https://old-logged-in.example';

jest.mock('./helpers/fetch', () => jest.fn());
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./getUsersPresence', () => ({ setPresenceCap: jest.fn() }));
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: { subscribe: jest.fn(), getHeaders: jest.fn(() => ({})), server: 'https://old-logged-in.example' }
}));
jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ query: () => ({ fetch: () => Promise.resolve([]) }) }),
			write: (cb: () => Promise<void>) => cb(),
			batch: () => Promise.resolve()
		},
		servers: {
			get: () => ({ find: () => Promise.resolve({ autoLock: false, autoLockTime: null, update: () => Promise.resolve() }) }),
			write: (cb: () => Promise<void>) => cb()
		}
	}
}));

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// URL passed to the Nth fetch call (settings are fetched with a trailing &offset=).
const fetchUrl = (callIndex: number): string => mockedFetch.mock.calls[callIndex][0] as string;

describe('getSettings', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the shared, process-global server slice so state does not bleed between tests.
		mockedStore.dispatch(selectServerClear());
		// Empty settings -> the pagination loop exits on the first iteration and the DB layer
		// stays a no-op, so the test only observes the fetched URL.
		mockedFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true, total: 0, settings: [] }) } as any);
	});

	describe('builds the URL from the redux server slice', () => {
		it('uses the _id query form on server version >= 7.0.0', async () => {
			mockedStore.dispatch(selectServerRequest('https://new.example', '7.0.0'));

			await getSettings();

			expect(mockedFetch).toHaveBeenCalled();
			expect(fetchUrl(0)).toContain('https://new.example/api/v1/settings.public?_id=');
		});

		it('uses the $in query form on server version < 7.0.0', async () => {
			mockedStore.dispatch(selectServerRequest('https://new.example', '6.0.0'));

			await getSettings();

			expect(fetchUrl(0)).toContain('https://new.example/api/v1/settings.public?query=');
		});

		it('re-targets the fetch at the newly selected workspace, not the previous one', async () => {
			// Switch to workspace A and fetch its settings.
			mockedStore.dispatch(selectServerRequest('https://workspace-a.example', '7.0.0'));
			await getSettings();

			// Switch to workspace B (e.g. adding/changing server) and fetch again.
			mockedStore.dispatch(selectServerRequest('https://workspace-b.example', '7.0.0'));
			await getSettings();

			expect(fetchUrl(0)).toContain('https://workspace-a.example/api/v1/settings.public');
			expect(fetchUrl(1)).toContain('https://workspace-b.example/api/v1/settings.public');
			expect(fetchUrl(1)).not.toContain('workspace-a.example');
		});

		it('ignores the SDK host entirely (does not fetch the old logged-in server)', async () => {
			mockedStore.dispatch(selectServerRequest('https://new.example', '7.0.0'));

			await getSettings();

			expect(fetchUrl(0)).toContain('https://new.example/api/v1/settings.public');
			expect(fetchUrl(0)).not.toContain(STALE_SDK_HOST);
		});
	});

	describe('applies the freshly fetched settings to redux after switching servers', () => {
		// settings.length must equal `total` so the pagination loop in getSettings exits after one fetch.
		const respondWithSiteName = (siteName: string) => ({
			json: () =>
				Promise.resolve({
					success: true,
					total: 1,
					offset: 0,
					settings: [{ _id: 'Site_Name', value: siteName }]
				})
		});

		it('writes the new server\'s settings into the redux settings slice', async () => {
			mockedFetch.mockResolvedValueOnce(respondWithSiteName('Workspace A') as any);
			mockedStore.dispatch(selectServerRequest('https://workspace-a.example', '7.0.0'));

			await getSettings();

			expect(mockedStore.getState().settings.Site_Name).toBe('Workspace A');
		});

		it('overwrites stale settings from the previous server with the latest fetch', async () => {
			// Seed redux with workspace A's settings.
			mockedFetch.mockResolvedValueOnce(respondWithSiteName('Workspace A') as any);
			mockedStore.dispatch(selectServerRequest('https://workspace-a.example', '7.0.0'));
			await getSettings();

			// Switch to workspace B; the second fetch returns workspace B's value.
			mockedFetch.mockResolvedValueOnce(respondWithSiteName('Workspace B') as any);
			mockedStore.dispatch(selectServerRequest('https://workspace-b.example', '7.0.0'));
			await getSettings();

			expect(fetchUrl(1)).toContain('https://workspace-b.example/api/v1/settings.public');
			expect(mockedStore.getState().settings.Site_Name).toBe('Workspace B');
		});
	});
});

describe('getLoginSettings', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(selectServerClear());
		mockedFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true, settings: [] }) } as any);
	});

	it('builds the URL from its server argument, not the redux server slice', async () => {
		// Redux points at a different (already logged-in) server...
		mockedStore.dispatch(selectServerRequest('https://other.example', '7.0.0'));

		// ...but getLoginSettings must target the workspace passed as an argument.
		await getLoginSettings({ server: 'https://added.workspace', serverVersion: '7.0.0' });

		expect(fetchUrl(0)).toContain('https://added.workspace/api/v1/settings.public?_id=');
		expect(fetchUrl(0)).not.toContain('other.example');
	});
});
