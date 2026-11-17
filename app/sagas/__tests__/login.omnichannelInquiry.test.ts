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

import loginRoot from '../login';
import { loginSuccess, setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { addSettings } from '~/actions/settings';
import { INQUIRY } from '~/actions/actionsTypes';
import { getPermissions } from '~/lib/methods/getPermissions';
import { isOmnichannelModuleAvailable } from '~/lib/methods/enterpriseModules';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { TSettingsState } from '~/reducers/settings';

afterEach(cancelSagaTasks);

const SERVER = 'https://omnichannel.rocket.chat';
const AGENT = { id: 'agent', token: 'agent-token', username: 'agent', name: 'Agent', statusLivechat: 'available' };

const setupStore = (settings?: TSettingsState) => {
	const recording = createRecordingStore(loginRoot);
	recording.store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Omnichannel' }));
	if (settings) {
		recording.store.dispatch(addSettings(settings));
	}
	return recording;
};

describe('login saga — requesting Inquiries for an available Agent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(isOmnichannelModuleAvailable).mockReturnValue(true);
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);
	});

	it('requests Inquiries at login when Omnichannel is enabled', async () => {
		const { store, dispatchedActions } = setupStore({ Livechat_enabled: true });

		store.dispatch(loginSuccess(AGENT));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(({ type }) => type)).toContain(INQUIRY.REQUEST);
	});

	it('does not request Inquiries at login when Omnichannel is disabled', async () => {
		const { store, dispatchedActions } = setupStore({ Livechat_enabled: false });

		store.dispatch(loginSuccess(AGENT));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(({ type }) => type)).not.toContain(INQUIRY.REQUEST);
	});

	it('requests Inquiries at login while the workspace settings have not loaded yet', async () => {
		const { store, dispatchedActions } = setupStore();

		store.dispatch(loginSuccess(AGENT));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(({ type }) => type)).toContain(INQUIRY.REQUEST);
	});

	it('requests Inquiries when the Agent status changes and Omnichannel is enabled', async () => {
		const { store, dispatchedActions } = setupStore({ Livechat_enabled: true });

		store.dispatch(setUser({ statusLivechat: 'available' }));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(({ type }) => type)).toContain(INQUIRY.REQUEST);
	});

	it('does not request Inquiries when the Agent status changes and Omnichannel is disabled', async () => {
		const { store, dispatchedActions } = setupStore({ Livechat_enabled: false });

		store.dispatch(setUser({ statusLivechat: 'available' }));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(({ type }) => type)).not.toContain(INQUIRY.REQUEST);
	});
});
