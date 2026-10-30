import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { clearWorkspaceSettings, getLoginSettings, getSettings, getSettingsFetchedFor, setSettings } from '../getSettings';
import { headers } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import log from '~/lib/methods/helpers/log';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';
import { store } from '~/lib/store/auxStore';
import { addSettings, fetchSettingsComplete } from '~/actions/settings';
import { flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import database from '~/lib/database';

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() }, servers: { get: jest.fn(), write: jest.fn() } }
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {}
}));

jest.mock('~/lib/methods/getUsersPresence', () => ({
	setPresenceCap: jest.fn()
}));

let mockActiveServer = 'https://settings.example';

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn(() => ({ server: { version: '7.0.0', server: mockActiveServer } })) }
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const PROBED_SERVER = 'https://probed.example';
const SERVER = 'https://settings.example';

beforeEach(() => {
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
	UserPreferences.removeItem(getBasicAuthKey(SERVER));
});

afterEach(() => {
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
	UserPreferences.removeItem(getBasicAuthKey(SERVER));
});

describe('getLoginSettings — per-request basic auth', () => {
	const sentToNetwork = mockGlobalFetch(() =>
		Promise.resolve({ json: () => Promise.resolve({ success: true, settings: [] }) } as Response)
	);

	beforeEach(() => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
	});

	it('sends the requested server its own stored basic auth instead of the active workspace one', async () => {
		UserPreferences.setString(getBasicAuthKey(PROBED_SERVER), 'probed-credentials');

		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '7.0.0' });

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][0]).toContain(`${PROBED_SERVER}/api/v1/settings.public`);
		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic probed-credentials' });
	});

	it('sends no basic auth at all when the requested server has none stored', async () => {
		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '7.0.0' });

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('picks the settings URL form from the requested server version', async () => {
		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '6.9.0' });

		expect(sentToNetwork.mock.calls[0][0]).toContain('query={"_id":{"$in"');
	});

	it('passes the abort signal to the request and stays silent once it is aborted', async () => {
		const controller = new AbortController();
		sentToNetwork.mockImplementationOnce(() => Promise.reject(new Error('aborted')));
		controller.abort();

		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '7.0.0', signal: controller.signal });

		expect(sentToNetwork.mock.calls[0][1]).toMatchObject({ signal: controller.signal });
		expect(log).not.toHaveBeenCalled();
	});
});

describe('getSettings — per-page basic auth', () => {
	const OTHER_WORKSPACE_AUTH = 'Basic other-workspace';
	const firstPage = { success: true, settings: [{ _id: 'Site_Name' }], total: 2 };
	const failedPage = { success: false };

	const sentToNetwork = mockGlobalFetch(() => {
		const isFirstPage = sentToNetwork.mock.calls.length === 1;
		if (isFirstPage) {
			RocketChatSettings.customHeaders = { ...headers, Authorization: OTHER_WORKSPACE_AUTH };
		}
		return Promise.resolve({ json: () => Promise.resolve(isFirstPage ? firstPage : failedPage) } as Response);
	});

	beforeEach(() => {
		RocketChatSettings.customHeaders = headers;
	});

	it('keeps sending the requested server its own basic auth on later pages after another workspace takes over the shared headers', async () => {
		UserPreferences.setString(getBasicAuthKey(SERVER), 'server-credentials');

		await getSettings(SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		expect(sentToNetwork.mock.calls[0][0]).toContain('&offset=0');
		expect(sentToNetwork.mock.calls[1][0]).toContain('&offset=1');
		sentToNetwork.mock.calls.forEach(([, options]) => {
			expect(options.headers).toMatchObject({ Authorization: 'Basic server-credentials' });
		});
	});

	it('never sends another workspace basic auth to a server that has none stored', async () => {
		await getSettings(SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		sentToNetwork.mock.calls.forEach(([, options]) => {
			expect(options.headers).not.toHaveProperty('Authorization');
		});
	});
});

describe('getSettings — active workspace', () => {
	let response: object;

	mockGlobalFetch(() => Promise.resolve({ json: () => Promise.resolve(response) } as Response));

	beforeEach(() => {
		jest.mocked(store.dispatch).mockClear();
		mockActiveServer = SERVER;
	});

	it('reports the settings fetch as complete when it fails', async () => {
		response = { success: false };

		await getSettings(SERVER);

		expect(store.dispatch).toHaveBeenCalledWith(fetchSettingsComplete());
		expect(getSettingsFetchedFor()).toBe(SERVER);
	});

	it('reports the settings it fetched when it completes', async () => {
		response = {
			success: true,
			settings: [
				{ _id: 'Apple_Watch_Quick_Actions', value: 'Yes,No' },
				{ _id: 'Apple_Watch_Quick_Actions_Max_Count', value: 4 }
			],
			total: 2
		};
		const write = jest.fn();
		Object.assign(database.active, { write });

		await getSettings(SERVER);

		expect(write).toHaveBeenCalledTimes(1);
		expect(store.dispatch).toHaveBeenCalledWith(
			fetchSettingsComplete({ Apple_Watch_Quick_Actions: 'Yes,No', Apple_Watch_Quick_Actions_Max_Count: 4 })
		);
	});

	it('marks the settings as not fetched while it fetches them', async () => {
		response = { success: false };
		await getSettings(SERVER);
		expect(getSettingsFetchedFor()).toBe(SERVER);

		const fetching = getSettings(SERVER);
		expect(getSettingsFetchedFor()).toBeNull();
		await fetching;

		expect(getSettingsFetchedFor()).toBe(SERVER);
	});

	it('drops the settings of a workspace that is no longer active', async () => {
		response = { success: true, settings: [{ _id: 'Site_Name', value: 'Old' }], total: 1 };
		mockActiveServer = 'https://other.example';

		await getSettings(SERVER);

		expect(store.dispatch).not.toHaveBeenCalled();
		expect(getSettingsFetchedFor()).toBeNull();
	});
});

describe('getSettings — the same workspace fetched twice', () => {
	const pendingResponses: ((body: object) => void)[] = [];
	const settingsResponse = (value: string) => ({ success: true, settings: [{ _id: 'Site_Name', value }], total: 1 });

	mockGlobalFetch(
		() =>
			new Promise<Response>(resolve => {
				pendingResponses.push(body => resolve({ json: () => Promise.resolve(body) } as Response));
			})
	);

	beforeEach(() => {
		pendingResponses.length = 0;
		jest.mocked(store.dispatch).mockClear();
		mockActiveServer = SERVER;
	});

	it('drops a response from the earlier fetch when it arrives last', async () => {
		const earlier = getSettings(SERVER);
		const later = getSettings(SERVER);
		await flushSagaMicrotasks();

		pendingResponses[1](settingsResponse('New'));
		await later;
		pendingResponses[0](settingsResponse('Old'));
		await earlier;

		expect(store.dispatch).toHaveBeenCalledWith(addSettings({ Site_Name: 'New' }));
		expect(store.dispatch).not.toHaveBeenCalledWith(addSettings({ Site_Name: 'Old' }));
		expect(
			jest.mocked(store.dispatch).mock.calls.filter(([action]) => action.type === fetchSettingsComplete().type)
		).toHaveLength(1);
	});

	it('does not persist the settings of an earlier fetch that a later one overtook while it read the server record', async () => {
		const write = jest.fn();
		Object.assign(database.active, { write });
		let releaseEarlierRead = () => {};
		const record = { update: jest.fn() };
		jest.mocked(database.servers.get).mockReturnValue({
			find: jest
				.fn()
				.mockReturnValueOnce(new Promise(resolve => (releaseEarlierRead = () => resolve(record))))
				.mockResolvedValue(record)
		} as any);

		const earlier = getSettings(SERVER);
		await flushSagaMicrotasks();
		pendingResponses[0](settingsResponse('Old'));
		await flushSagaMicrotasks();
		const later = getSettings(SERVER);
		await flushSagaMicrotasks();
		pendingResponses[1](settingsResponse('New'));
		await later;
		releaseEarlierRead();
		await earlier;

		expect(write).toHaveBeenCalledTimes(1);
	});
});

describe('clearWorkspaceSettings', () => {
	it('unsets the workspace settings and leaves the login settings alone', () => {
		jest.mocked(store.dispatch).mockClear();

		clearWorkspaceSettings();

		const [[cleared]] = jest.mocked(store.dispatch).mock.calls;
		expect(cleared).toHaveProperty('payload.Apple_Watch_Quick_Actions', undefined);
		expect(cleared).not.toHaveProperty('payload.Site_Url');
	});
});

describe('setSettings', () => {
	beforeEach(() => {
		jest.mocked(store.dispatch).mockClear();
		mockActiveServer = SERVER;
		jest.mocked(database.active.get).mockReturnValue({
			query: () => ({ fetch: () => Promise.resolve([{ id: 'Site_Name', valueAsString: 'Cached' }]) })
		} as any);
	});

	it('loads the cached settings of the active workspace', async () => {
		await setSettings(SERVER);

		expect(store.dispatch).toHaveBeenCalledWith(addSettings({ Site_Name: 'Cached' }));
	});

	it('drops the cached settings once another workspace is selected', async () => {
		mockActiveServer = 'https://other.example';

		await setSettings(SERVER);

		expect(store.dispatch).not.toHaveBeenCalled();
	});
});
