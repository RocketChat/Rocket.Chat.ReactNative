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

jest.mock('~/lib/methods/watchOSQuickReplies/syncWatchOSQuickRepliesWithServer', () => ({
	syncWatchOSQuickRepliesWithServer: jest.fn()
}));

import loginRoot from '../login';
import { loginSuccess } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { addSettings, fetchSettingsComplete } from '~/actions/settings';
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

	it('seeds with the server setting once it is loaded', async () => {
		const { store } = setupStore({ Apple_Watch_Quick_Actions: 'Yes,No' });

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'Yes,No');
	});

	it('waits for the settings fetch when the setting is not loaded yet', async () => {
		const { store } = setupStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		expect(syncWatchOSQuickRepliesWithServer).not.toHaveBeenCalled();

		store.dispatch(addSettings({ Apple_Watch_Quick_Actions: 'OK' }));
		store.dispatch(fetchSettingsComplete());
		await flushSagaMicrotasks();

		expect(syncWatchOSQuickRepliesWithServer).toHaveBeenCalledWith(SERVER, 'OK');
	});
});
