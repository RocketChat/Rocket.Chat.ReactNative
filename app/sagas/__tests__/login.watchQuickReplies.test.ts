jest.mock('~/lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('~/lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
}));

jest.mock('~/lib/methods/getCustomEmojis', () => ({
	getCustomEmojis: jest.fn()
}));

jest.mock('~/lib/methods/getRoles', () => ({
	getRoles: jest.fn()
}));

jest.mock('~/lib/methods/getSlashCommands', () => ({
	getSlashCommands: jest.fn()
}));

jest.mock('~/lib/methods/getSettings', () => ({
	subscribeSettings: jest.fn()
}));

jest.mock('~/lib/methods/getUsersPresence', () => ({
	getUserPresence: jest.fn(),
	refreshDmUsersPresence: jest.fn(),
	subscribeUsersPresence: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	getUsersRoles: jest.fn(() => []),
	registerPushToken: jest.fn(),
	saveUserProfile: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('~/lib/services/connect', () => ({
	disconnect: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));

jest.mock('~/lib/methods/logout', () => ({
	logout: jest.fn(),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));

jest.mock('~/lib/methods/loggedInServer', () => ({
	findLoggedInServer: jest.fn(async () => undefined)
}));

jest.mock('~/lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));

jest.mock('~/lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } },
		subscribe: jest.fn()
	}
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: { get: jest.fn() },
		servers: {
			get: jest.fn(() => ({
				find: jest.fn(() => Promise.reject(new Error('not found'))),
				create: jest.fn(),
				schema: {}
			})),
			write: jest.fn(async (block: () => Promise<void>) => block())
		}
	}
}));

jest.mock('~/lib/methods/watchOSQuickReplies/isWatchAppInstalled', () => ({
	isWatchAppInstalled: jest.fn(() => true)
}));

jest.mock('~/lib/methods/watchOSQuickReplies/syncWatchOSQuickRepliesWithServer', () => ({
	syncWatchOSQuickRepliesWithServer: jest.fn()
}));

jest.mock('~/lib/methods/watchOSQuickReplies/syncWatchOSQuickReplies', () => ({
	syncWatchOSQuickReplies: jest.fn()
}));

jest.mock('~/lib/methods/watchOSQuickReplies/getQuickRepliesSettings', () => ({
	getQuickRepliesSettings: jest.fn()
}));

import loginRoot from '../login';
import { deleteAccount, loginSuccess, logout } from '~/actions/login';
import { selectServerRequest, selectServerSuccess } from '~/actions/server';
import UserPreferences from '~/lib/methods/userPreferences';
import { getQuickRepliesKey } from '~/lib/methods/watchOSQuickReplies/getQuickRepliesKey';
import { getQuickRepliesSettings } from '~/lib/methods/watchOSQuickReplies/getQuickRepliesSettings';
import { isWatchAppInstalled } from '~/lib/methods/watchOSQuickReplies/isWatchAppInstalled';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncWatchOSQuickReplies';
import { syncWatchOSQuickRepliesWithServer } from '~/lib/methods/watchOSQuickReplies/syncWatchOSQuickRepliesWithServer';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { TSettingsState } from '~/reducers/settings';

afterEach(cancelSagaTasks);

const SERVER = 'https://watch.rocket.chat';
const USER = { id: 'user', token: 'user-token', username: 'user', name: 'User' };
const SETTINGS: TSettingsState = { Apple_Watch_Quick_Actions: 'Yes,No', Apple_Watch_Quick_Actions_Max_Count: 3 };

let resolveFetch: (settings: TSettingsState) => void;

const setupStore = () => {
	const recording = createRecordingStore(loginRoot);
	recording.store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Watch' }));
	return recording;
};

describe('login saga — watch quick replies', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		UserPreferences.removeItem(getQuickRepliesKey(SERVER));
		jest.mocked(getQuickRepliesSettings).mockImplementation(
			() =>
				new Promise(resolve => {
					resolveFetch = resolve;
				})
		);
	});

	it('seeds with the settings fetched from the workspace', async () => {
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		resolveFetch(SETTINGS);
		await flushSagaMicrotasks();

		expect(getQuickRepliesSettings).toHaveBeenCalledWith(SERVER, '7.0.0');
		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, SETTINGS);
	});

	it('does nothing without a watch app', async () => {
		jest.mocked(isWatchAppInstalled).mockReturnValueOnce(false);
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(getQuickRepliesSettings).not.toHaveBeenCalled();
		expect(syncWatchOSQuickReplies).not.toHaveBeenCalled();
	});

	it('syncs the stored list without fetching the settings', async () => {
		UserPreferences.setString(getQuickRepliesKey(SERVER), JSON.stringify(['Mine']));
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickReplies).toHaveBeenCalled();
		expect(getQuickRepliesSettings).not.toHaveBeenCalled();
	});

	it('keeps fetching when the same workspace is selected again', async () => {
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER, '7.0.0'));
		resolveFetch(SETTINGS);
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, SETTINGS);
	});

	it.each([
		['the user switches workspace', () => selectServerRequest('https://other.rocket.chat', '7.0.0')],
		['the user logs out', () => logout()],
		['the user deletes the account', () => deleteAccount()],
		['the user logs in again', () => loginSuccess(USER)]
	])('drops the fetched settings when %s', async (_, stopAction) => {
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		const resolveFirstFetch = resolveFetch;
		store.dispatch(stopAction());
		await flushSagaMicrotasks();
		resolveFirstFetch(SETTINGS);
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});
});
