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

jest.mock('~/lib/methods/watchOSQuickReplies/getWatchStatus', () => ({
	shouldShowWatchAppOptions: jest.fn(() => true)
}));

jest.mock('~/lib/methods/watchOSQuickReplies/syncWatchOSQuickRepliesWithServer', () => ({
	syncWatchOSQuickRepliesWithServer: jest.fn()
}));

import loginRoot from '../login';
import { deleteAccount, loginSuccess, logout } from '~/actions/login';
import { selectServerRequest, selectServerSuccess } from '~/actions/server';
import { addSettings, fetchSettingsComplete } from '~/actions/settings';
import { getPermissions } from '~/lib/methods/getPermissions';
import { shouldShowWatchAppOptions } from '~/lib/methods/watchOSQuickReplies/getWatchStatus';
import { syncWatchOSQuickRepliesWithServer } from '~/lib/methods/watchOSQuickReplies/syncWatchOSQuickRepliesWithServer';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { TSettingsState } from '~/reducers/settings';

afterEach(cancelSagaTasks);

const SERVER = 'https://watch.rocket.chat';
const USER = { id: 'user', token: 'user-token', username: 'user', name: 'User' };

const setupStore = (settings?: TSettingsState) => {
	const recording = createRecordingStore(loginRoot);
	recording.store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Watch' }));
	if (settings) {
		recording.store.dispatch(addSettings(settings));
	}
	return recording;
};

describe('login saga — watch quick replies', () => {
	beforeEach(() => jest.clearAllMocks());

	it('seeds with the server setting once it is fetched', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });
		store.dispatch(fetchSettingsComplete(SERVER));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('does not sync without a watch app', async () => {
		jest.mocked(shouldShowWatchAppOptions).mockReturnValueOnce(false);
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });
		store.dispatch(fetchSettingsComplete(SERVER));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});

	it('waits for the current settings fetch instead of seeding a cached value', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Old' });

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();

		store.dispatch(addSettings({ Apple_Watch_Quick_Actions: 'OK' }));
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'OK');
	});

	it('does not sync when the user logged out before login finished', async () => {
		let finishPermissions = () => {};
		jest.mocked(getPermissions).mockReturnValueOnce(new Promise<void>(resolve => (finishPermissions = resolve)));
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });
		store.dispatch(fetchSettingsComplete(SERVER));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(logout());
		finishPermissions();
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});

	it('syncs without waiting when the settings fetch already finished without the setting', async () => {
		const { store } = setupStore();
		store.dispatch(fetchSettingsComplete(SERVER));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, undefined);
	});

	it('stops waiting when the user switches workspace after login finished', async () => {
		jest.useFakeTimers();
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.advanceTimersByTime(2500);
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest('https://other.rocket.chat', '7.0.0'));
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();
		jest.useRealTimers();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});

	it('keeps waiting when the same workspace is selected again', async () => {
		jest.useFakeTimers();
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.advanceTimersByTime(2500);
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER, '7.0.0'));
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();
		jest.useRealTimers();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('keeps waiting when the same workspace is selected again right after login', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER, '7.0.0'));
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('seeds after switching back from a workspace that never connected', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });
		store.dispatch(fetchSettingsComplete(SERVER));
		store.dispatch(selectServerRequest('https://other.rocket.chat', '7.0.0'));
		store.dispatch(selectServerRequest(SERVER, '7.0.0'));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('waits when the fetched settings belong to another workspace', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });
		store.dispatch(fetchSettingsComplete('https://other.rocket.chat'));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();

		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();
		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('stops waiting when the user deletes the account', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(deleteAccount());
		await flushSagaMicrotasks();
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});

	it('stops waiting when the user logs in again', async () => {
		jest.useFakeTimers();
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.advanceTimersByTime(2500);
		await flushSagaMicrotasks();
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();
		jest.useRealTimers();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledTimes(1);
	});

	it('stops waiting when the user logs out', async () => {
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(logout());
		store.dispatch(fetchSettingsComplete(SERVER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();
	});
});
