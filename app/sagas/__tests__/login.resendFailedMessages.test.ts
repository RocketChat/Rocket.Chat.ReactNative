jest.mock('~/lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('~/lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isOmnichannelStatusAvailable: jest.fn(() => false),
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

jest.mock('../resendFailedMessages', () => ({
	resendFailedMessages: jest.fn(function* () {})
}));

import loginRoot from '../login';
import { resendFailedMessages } from '../resendFailedMessages';
import { loginSuccess } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { getPermissions } from '~/lib/methods/getPermissions';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

afterEach(cancelSagaTasks);

const LOGIN_BOOTSTRAP_WINDOW_MS = 2000;
const SERVER = 'https://resend.rocket.chat';
const USER = { id: 'user', token: 'user-token', username: 'user', name: 'User' };

describe('login saga — resending failed messages', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('starts resending failed messages on every successful login', async () => {
		const { store } = createRecordingStore(loginRoot);
		store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Resend' }));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		expect(resendFailedMessages).toHaveBeenCalledTimes(1);

		await jest.advanceTimersByTimeAsync(LOGIN_BOOTSTRAP_WINDOW_MS);
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		expect(resendFailedMessages).toHaveBeenCalledTimes(2);
	});
});
