import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getServerInfo } from '../getServerInfo';
import fetch from '../helpers/fetch';
import UserPreferences from '../userPreferences';
import { store } from '../../store/auxStore';
import { getSupportedVersionsCloud } from '../../services/restApi';
import { getServerUserIdKey, getUserTokenKey } from '../../constants/keys';

jest.mock('../helpers/fetch', () => ({ __esModule: true, default: jest.fn(), BASIC_AUTH_KEY: 'BASIC_AUTH_KEY' }));
jest.mock('../userPreferences', () => ({ __esModule: true, default: { getString: jest.fn() } }));
jest.mock('../../store/auxStore', () => ({ store: { getState: jest.fn(), dispatch: jest.fn() } }));
jest.mock('../../database/services/Server', () => ({ getServerById: jest.fn() }));
jest.mock('../../services/restApi', () => ({ getSupportedVersionsCloud: jest.fn() }));

const mockedFetch = jest.mocked(fetch);
const getString = jest.mocked(UserPreferences.getString);

const currentServer = 'https://workspace.example';
const attackerServer = 'https://attacker.example';

const requestOptions = () => mockedFetch.mock.calls[0][1]!;

const mockStoredPreferences = (stored: Record<string, string>) =>
	getString.mockImplementation((key: string) => (stored[key] ?? null) as any);

describe('getServerInfo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest
			.mocked(store.getState)
			.mockReturnValue({ login: { user: { id: 'uid', token: 'secret' } }, server: { version: '7.0.0' } } as any);
		mockedFetch.mockResolvedValue({ json: () => Promise.resolve({ success: false }) } as any);
		mockStoredPreferences({
			[getServerUserIdKey(currentServer)]: 'uid',
			[getUserTokenKey(currentServer, 'uid')]: 'secret'
		});
	});

	it('sends the session headers to a server the user is signed in to', async () => {
		await getServerInfo(currentServer);

		expect(requestOptions().headers).toMatchObject({ 'X-Auth-Token': 'secret', 'X-User-Id': 'uid' });
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});

	it('does not send the session headers to an unknown server', async () => {
		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});

	it('does not send the session headers when the stored user id differs', async () => {
		getString.mockImplementation((key: string) => (key.endsWith(attackerServer) ? 'someone-else' : null) as any);

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});

	it('does not send the session headers when the server reports the same user id but holds a different token', async () => {
		mockStoredPreferences({
			[getServerUserIdKey(attackerServer)]: 'uid',
			[getUserTokenKey(attackerServer, 'uid')]: 'attacker-token'
		});

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});

	it('sends only the stored basic auth of that server when there is no session', async () => {
		getString.mockImplementation((key: string) => (key === `BASIC_AUTH_KEY-${attackerServer}` ? 'creds' : null) as any);

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).toMatchObject({ Authorization: 'Basic creds' });
		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});

	it('does not send basic auth to a server without stored basic auth', async () => {
		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('Authorization');
		expect(requestOptions().skipCustomHeaders).toBe(true);
	});
});

describe('getServerInfo cloud lookup', () => {
	const originalGlobalFetch = global.fetch;
	const originalCustomHeaders = RocketChatSettings.customHeaders;
	const sentToNetwork = jest.fn((_url: string, _options: { headers: Record<string, string> }) =>
		Promise.resolve({ json: () => Promise.resolve({ success: true, version: '7.0.0' }) })
	);

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(store.getState).mockReturnValue({ login: { user: undefined }, server: { version: '7.0.0' } } as any);
		getString.mockReturnValue(null as any);
		jest.mocked(getSupportedVersionsCloud).mockResolvedValue({ json: () => Promise.resolve({}) } as any);
		mockedFetch.mockImplementation(jest.requireActual('../helpers/fetch').default);
		global.fetch = sentToNetwork as unknown as typeof global.fetch;
		RocketChatSettings.customHeaders = { Authorization: 'Basic current-workspace' };
	});

	afterEach(() => {
		global.fetch = originalGlobalFetch;
		RocketChatSettings.customHeaders = originalCustomHeaders;
	});

	it('does not send the current workspace basic auth to the requested host', async () => {
		await getServerInfo(attackerServer);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		expect(sentToNetwork.mock.calls.map(([url]) => url)).toEqual([
			`${attackerServer}/api/info`,
			`${attackerServer}/api/v1/settings.public?_id=uniqueID`
		]);
		sentToNetwork.mock.calls.forEach(([, options]) => expect(options.headers).not.toHaveProperty('Authorization'));
	});

	it('sends the requested host its own stored basic auth on the cloud lookup', async () => {
		getString.mockImplementation((key: string) => (key === `BASIC_AUTH_KEY-${attackerServer}` ? 'attacker-creds' : null) as any);

		await getServerInfo(attackerServer);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		sentToNetwork.mock.calls.forEach(([, options]) =>
			expect(options.headers).toMatchObject({ Authorization: 'Basic attacker-creds' })
		);
	});
});
