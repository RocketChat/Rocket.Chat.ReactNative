import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getLoginSettings, getSettings } from '../getSettings';
import { headers } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import log from '~/lib/methods/helpers/log';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';
import database from '~/lib/database';
import { DEFAULT_AUTO_LOCK } from '~/lib/constants/localAuthentication';

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

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn(() => ({ server: { version: '7.0.0' } })) }
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

describe('getSettings — admin force screen lock', () => {
	interface IFakeServerRecord {
		autoLock: boolean;
		autoLockTime?: number | null;
		update: jest.Mock;
	}

	let serverRecord: IFakeServerRecord;
	let publicSettings: { _id: string; value: unknown }[];

	mockGlobalFetch(() =>
		Promise.resolve({
			json: () => Promise.resolve({ success: true, settings: publicSettings, total: publicSettings.length })
		} as Response)
	);

	const givenServerRecord = (fields: Partial<Omit<IFakeServerRecord, 'update'>>) => {
		serverRecord = {
			autoLock: false,
			autoLockTime: null,
			update: jest.fn((applyChanges: (record: IFakeServerRecord) => void) => applyChanges(serverRecord)),
			...fields
		};
	};

	beforeEach(() => {
		jest.mocked(database.servers.get).mockReturnValue({ find: jest.fn(() => Promise.resolve(serverRecord)) } as any);
		jest.mocked(database.servers.write).mockImplementation(work => work({} as never));
	});

	afterEach(() => {
		jest.mocked(database.servers.get).mockReset();
		jest.mocked(database.servers.write).mockReset();
	});

	it('turns auto lock on and adopts the admin lock time when the admin forces screen lock', async () => {
		givenServerRecord({ autoLock: false });
		publicSettings = [
			{ _id: 'Force_Screen_Lock', value: true },
			{ _id: 'Force_Screen_Lock_After', value: 120 }
		];

		await getSettings(SERVER);

		expect(serverRecord.autoLock).toBe(true);
		expect(serverRecord.autoLockTime).toBe(120);
	});

	it('keeps auto lock on after the admin stops forcing screen lock', async () => {
		givenServerRecord({ autoLock: true });
		publicSettings = [{ _id: 'Force_Screen_Lock', value: false }];

		await getSettings(SERVER);

		expect(serverRecord.update).toHaveBeenCalledTimes(1);
		expect(serverRecord.autoLock).toBe(true);
	});

	it('falls back to the default lock time when the admin lock time is zero and none is stored', async () => {
		givenServerRecord({ autoLockTime: null });
		publicSettings = [{ _id: 'Force_Screen_Lock_After', value: 0 }];

		await getSettings(SERVER);

		expect(serverRecord.autoLockTime).toBe(DEFAULT_AUTO_LOCK);
	});

	it('keeps the stored lock time when the admin sets a lock time without forcing screen lock', async () => {
		givenServerRecord({ autoLockTime: 300 });
		publicSettings = [
			{ _id: 'Force_Screen_Lock', value: false },
			{ _id: 'Force_Screen_Lock_After', value: 120 }
		];

		await getSettings(SERVER);

		expect(serverRecord.update).toHaveBeenCalledTimes(1);
		expect(serverRecord.autoLockTime).toBe(300);
	});
});
