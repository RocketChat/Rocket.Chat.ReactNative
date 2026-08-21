jest.mock('../../lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('../../lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isOmnichannelStatusAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
}));

jest.mock('../../lib/methods/getCustomEmojis', () => ({
	getCustomEmojis: jest.fn()
}));

jest.mock('../../lib/methods/getRoles', () => ({
	getRoles: jest.fn()
}));

jest.mock('../../lib/methods/getSlashCommands', () => ({
	getSlashCommands: jest.fn()
}));

jest.mock('../../lib/methods/getSettings', () => ({
	subscribeSettings: jest.fn()
}));

jest.mock('../../lib/methods/getUsersPresence', () => ({
	getUserPresence: jest.fn(),
	refreshDmUsersPresence: jest.fn(),
	subscribeUsersPresence: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	getUsersRoles: jest.fn(() => []),
	registerPushToken: jest.fn(),
	saveUserProfile: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('../../lib/services/connect', () => ({
	disconnect: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));

jest.mock('../../lib/methods/logout', () => ({
	logout: jest.fn(),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));

jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));

jest.mock('../../lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('../../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } },
		subscribe: jest.fn()
	}
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

const mockServersQuery = { query: jest.fn(() => ({ fetch: jest.fn() })) };

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		active: { get: jest.fn() },
		servers: {
			get: jest.fn(() => mockServersQuery),
			write: jest.fn(async (block: () => Promise<void>) => block())
		}
	}
}));

import loginRoot from '../login';
import { logout } from '../../actions/login';
import { selectServerSuccess } from '../../actions/server';
import { SERVER } from '../../actions/actionsTypes';
import UserPreferences from '../../lib/methods/userPreferences';
import { TOKEN_KEY } from '../../lib/constants/keys';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';

afterEach(cancelSagaTasks);

const LOGGED_OUT_SERVER = 'https://logged-out.rocket.chat';
const OTHER_SERVER = 'https://other.rocket.chat';

const setRemainingServers = (servers: { id: string }[]) => {
	mockServersQuery.query.mockReturnValue({ fetch: jest.fn(() => Promise.resolve(servers)) });
};

const runForcedLogout = async () => {
	const { store, dispatchedActions } = createRecordingStore(loginRoot);
	store.dispatch(selectServerSuccess({ server: LOGGED_OUT_SERVER, version: '7.0.0', name: 'Logged out' }));
	store.dispatch(logout(true, 'Logged_out_by_server'));
	await flushSagaMicrotasks();
	return dispatchedActions;
};

describe('login saga — a logout forced by the server', () => {
	beforeEach(() => {
		UserPreferences.removeItem(`${TOKEN_KEY}-${OTHER_SERVER}`);
		jest.clearAllMocks();
	});

	it('points previousServer at another logged in workspace, so the user can leave NewServerView', async () => {
		setRemainingServers([{ id: OTHER_SERVER }]);
		UserPreferences.setString(`${TOKEN_KEY}-${OTHER_SERVER}`, 'user-id');

		const dispatchedActions = await runForcedLogout();

		expect(dispatchedActions).toEqual(expect.arrayContaining([{ type: SERVER.INIT_ADD, previousServer: OTHER_SERVER }]));
	});

	it('leaves previousServer unset when no other workspace is logged in', async () => {
		setRemainingServers([{ id: OTHER_SERVER }]);

		const dispatchedActions = await runForcedLogout();

		expect(dispatchedActions.some(({ type }) => type === SERVER.INIT_ADD)).toBe(false);
	});
});
