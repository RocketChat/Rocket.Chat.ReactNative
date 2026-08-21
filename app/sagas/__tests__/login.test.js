import { runSaga } from 'redux-saga';

import { SERVER } from '../../actions/actionsTypes';
import database from '../../lib/database';
import UserPreferences from '../../lib/methods/userPreferences';
import { TOKEN_KEY } from '../../lib/constants/keys';
import { handleLogout } from '../login';

jest.mock('../../lib/methods/logout', () => ({
	logout: jest.fn(() => Promise.resolve()),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));
jest.mock('../../lib/services/connect', () => ({
	connect: jest.fn(),
	disconnect: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));
jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({ mediaSessionInstance: {} }));
jest.mock('../../lib/services/voip/MediaSessionStore', () => ({ mediaSessionStore: { getState: () => ({}) } }));
jest.mock('../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../lib/database', () => ({ servers: { get: jest.fn() } }));
jest.mock('../../lib/methods/userPreferences', () => ({ getString: jest.fn() }));

const loggedOutServer = 'https://open.rocket.chat';

const setServers = servers => {
	database.servers.get.mockReturnValue({ query: () => ({ fetch: () => Promise.resolve(servers) }) });
};

const runForcedLogout = async () => {
	const dispatched = [];
	await runSaga(
		{
			dispatch: action => dispatched.push(action),
			getState: () => ({ server: { server: loggedOutServer } })
		},
		handleLogout,
		{ forcedByServer: true }
	).toPromise();
	return dispatched;
};

describe('handleLogout forced by the server', () => {
	beforeEach(() => jest.clearAllMocks());

	it('should set the previous server to another logged in server, so the user can leave NewServerView', async () => {
		setServers([{ id: 'https://other.rocket.chat' }]);
		UserPreferences.getString.mockImplementation(key => (key === `${TOKEN_KEY}-https://other.rocket.chat` ? 'token' : null));

		const dispatched = await runForcedLogout();

		expect(dispatched).toEqual(expect.arrayContaining([{ type: SERVER.INIT_ADD, previousServer: 'https://other.rocket.chat' }]));
	});

	it('should not set a previous server when no other server is logged in', async () => {
		setServers([{ id: 'https://logged-out.rocket.chat' }]);
		UserPreferences.getString.mockReturnValue(null);

		const dispatched = await runForcedLogout();

		expect(dispatched.some(({ type }) => type === SERVER.INIT_ADD)).toBe(false);
	});
});
