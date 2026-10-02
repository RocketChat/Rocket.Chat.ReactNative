import { getServerInfo } from './getServerInfo';
import fetch from './helpers/fetch';
import UserPreferences from './userPreferences';
import { store } from '../store/auxStore';

jest.mock('./helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./userPreferences', () => ({ __esModule: true, default: { getString: jest.fn() } }));
jest.mock('../store/auxStore', () => ({ store: { getState: jest.fn(), dispatch: jest.fn() } }));
jest.mock('../database/services/Server', () => ({ getServerById: jest.fn() }));
jest.mock('../services/restApi', () => ({ getSupportedVersionsCloud: jest.fn() }));

const mockedFetch = jest.mocked(fetch);
const getString = jest.mocked(UserPreferences.getString);

const currentServer = 'https://workspace.example';
const attackerServer = 'https://attacker.example';

const requestOptions = () => mockedFetch.mock.calls[0][1]!;

describe('getServerInfo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(store.getState).mockReturnValue({ login: { user: { id: 'uid', token: 'secret' } } } as any);
		mockedFetch.mockResolvedValue({ json: () => Promise.resolve({ success: false }) } as any);
		getString.mockImplementation((key: string) => (key.endsWith(currentServer) ? 'uid' : null) as any);
	});

	it('sends the session headers to a server the user is signed in to', async () => {
		await getServerInfo(currentServer);

		expect(requestOptions().headers).toMatchObject({ 'X-Auth-Token': 'secret', 'X-User-Id': 'uid' });
	});

	it('does not send the session headers to an unknown server', async () => {
		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
	});

	it('does not send the session headers when the stored user id differs', async () => {
		getString.mockImplementation((key: string) => (key.endsWith(attackerServer) ? 'someone-else' : null) as any);

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
	});
});
