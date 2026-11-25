import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { rsaImportPublicKey, rsaVerifyJwt } from '@rocket.chat/mobile-crypto';

import { getServerInfo } from '../getServerInfo';
import fetch from '~/lib/methods/helpers/fetch';
import log from '~/lib/methods/helpers/log';
import UserPreferences from '~/lib/methods/userPreferences';
import { store } from '~/lib/store/auxStore';
import { getSupportedVersionsCloud } from '~/lib/services/restApi';
import { getServerById } from '~/lib/database/services/Server';
import { getBasicAuthKey, getServerUserIdKey, getUserTokenKey } from '~/lib/constants/keys';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

jest.mock('~/lib/methods/helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/userPreferences', () => ({ __esModule: true, default: { getString: jest.fn() } }));
jest.mock('~/lib/store/auxStore', () => ({ store: { getState: jest.fn(), dispatch: jest.fn() } }));
jest.mock('~/lib/database/services/Server', () => ({ getServerById: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ getSupportedVersionsCloud: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

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
	});

	it('does not send the session headers to an unknown server', async () => {
		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
	});

	it('does not send the session headers when the server has a stored user id but no token', async () => {
		getString.mockImplementation((key: string) => (key === getServerUserIdKey(attackerServer) ? 'someone-else' : null) as any);

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
		expect(requestOptions().headers).not.toHaveProperty('X-User-Id');
	});

	it('sends an inactive signed-in workspace its own stored session', async () => {
		const otherServer = 'https://other.example';
		mockStoredPreferences({
			[getServerUserIdKey(otherServer)]: 'other-uid',
			[getUserTokenKey(otherServer, 'other-uid')]: 'other-token'
		});

		await getServerInfo(otherServer);

		expect(requestOptions().headers).toMatchObject({ 'X-Auth-Token': 'other-token', 'X-User-Id': 'other-uid' });
	});

	it('sends only the stored basic auth of that server when there is no session', async () => {
		getString.mockImplementation((key: string) => (key === getBasicAuthKey(attackerServer) ? 'creds' : null) as any);

		await getServerInfo(attackerServer);

		expect(requestOptions().headers).toMatchObject({ Authorization: 'Basic creds' });
		expect(requestOptions().headers).not.toHaveProperty('X-Auth-Token');
	});

	it('scopes basic auth to none for a server without stored basic auth', async () => {
		await getServerInfo(attackerServer);

		expect(requestOptions().headers?.Authorization).toBeUndefined();
	});

	it('passes the abort signal to the info request', async () => {
		const controller = new AbortController();

		await getServerInfo(attackerServer, controller.signal);

		expect(requestOptions().signal).toBe(controller.signal);
	});

	it('leaves the store alone when the request fails because the signal aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		mockedFetch.mockRejectedValueOnce(new Error('Aborted'));

		await expect(getServerInfo(attackerServer, controller.signal)).resolves.toMatchObject({ success: false });

		expect(store.dispatch).not.toHaveBeenCalled();
	});

	it('still fails the workspace switch when an abort comes from somewhere else', async () => {
		mockedFetch.mockRejectedValueOnce(new Error('Aborted'));

		await expect(getServerInfo(attackerServer)).rejects.toThrow('Aborted');

		expect(store.dispatch).toHaveBeenCalledTimes(1);
	});
});

describe('getServerInfo cloud lookup', () => {
	const sentToNetwork = mockGlobalFetch(() =>
		Promise.resolve({ json: () => Promise.resolve({ success: true, version: '7.0.0' }) } as Response)
	);

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(store.getState).mockReturnValue({ login: { user: undefined }, server: { version: '7.0.0' } } as any);
		getString.mockReturnValue(null as any);
		jest.mocked(getSupportedVersionsCloud).mockResolvedValue({ json: () => Promise.resolve({}) } as any);
		mockedFetch.mockImplementation(jest.requireActual('~/lib/methods/helpers/fetch').default);
		RocketChatSettings.customHeaders = { Authorization: 'Basic current-workspace' };
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
		getString.mockImplementation((key: string) => (key === getBasicAuthKey(attackerServer) ? 'attacker-creds' : null) as any);

		await getServerInfo(attackerServer);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		sentToNetwork.mock.calls.forEach(([, options]) =>
			expect(options.headers).toMatchObject({ Authorization: 'Basic attacker-creds' })
		);
	});

	it('passes the abort signal to every request of the lookup', async () => {
		const controller = new AbortController();

		await getServerInfo(attackerServer, controller.signal);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		sentToNetwork.mock.calls.forEach(([, options]) => expect(options.signal).toBe(controller.signal));
		expect(getSupportedVersionsCloud).toHaveBeenCalledWith(undefined, attackerServer, controller.signal);
	});

	it('does not log a failed lookup when the signal aborted', async () => {
		const controller = new AbortController();
		sentToNetwork
			.mockImplementationOnce(() =>
				Promise.resolve({ json: () => Promise.resolve({ success: true, version: '7.0.0' }) } as Response)
			)
			.mockImplementationOnce(() => {
				controller.abort();
				return Promise.reject(new Error('Aborted'));
			});

		await getServerInfo(attackerServer, controller.signal);

		expect(log).not.toHaveBeenCalled();
	});

	it('logs a failed lookup when the signal did not abort', async () => {
		sentToNetwork
			.mockImplementationOnce(() =>
				Promise.resolve({ json: () => Promise.resolve({ success: true, version: '7.0.0' }) } as Response)
			)
			.mockImplementationOnce(() => Promise.reject(new Error('network down')));

		await getServerInfo(attackerServer, new AbortController().signal);

		expect(log).toHaveBeenCalledTimes(1);
	});

	it('picks the unique-id URL form from the requested server version, not the active one', async () => {
		jest.mocked(store.getState).mockReturnValue({ login: { user: undefined }, server: { version: '6.9.0' } } as any);

		await getServerInfo(attackerServer);

		expect(sentToNetwork.mock.calls.map(([url]) => url)).toEqual([
			`${attackerServer}/api/info`,
			`${attackerServer}/api/v1/settings.public?_id=uniqueID`
		]);
	});
});

describe('getServerInfo supported versions', () => {
	const supportedVersionsKey = { kind: 'supported-versions-key' };
	const supportedVersionsPayload = { timestamp: '2026-11-01T00:00:00.000Z', enforcementStartDate: '2027-01-01T00:00:00.000Z' };

	const mockServerInfo = (serverInfo: object) =>
		mockedFetch.mockResolvedValue({ json: () => Promise.resolve({ success: true, version: '7.0.0', ...serverInfo }) } as any);

	const mockCloudFallback = () => {
		jest.mocked(getSupportedVersionsCloud).mockResolvedValue({ json: () => Promise.resolve({ signed: 'cloud-token' }) } as any);
		mockedFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({ success: true, version: '7.0.0', supportedVersions: { signed: 'forged-token' } })
		} as any);
		mockedFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ settings: [{ value: 'unique-id' }] }) } as any);
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(store.getState).mockReturnValue({ login: { user: undefined }, server: { version: '7.0.0' } } as any);
		getString.mockReturnValue(null as any);
		jest.mocked(rsaImportPublicKey).mockResolvedValue(supportedVersionsKey as any);
		jest.mocked(rsaVerifyJwt).mockResolvedValue(JSON.stringify(supportedVersionsPayload));
		jest.mocked(getServerById).mockResolvedValue(null);
	});

	it('returns the payload of a server token that verifies against the supported versions key', async () => {
		mockServerInfo({ supportedVersions: { signed: 'server-token' } });

		const serverInfo = await getServerInfo(currentServer);

		expect(rsaVerifyJwt).toHaveBeenCalledWith(supportedVersionsKey, 'server-token');
		expect(serverInfo).toMatchObject({ success: true, supportedVersions: supportedVersionsPayload });
		expect(getSupportedVersionsCloud).not.toHaveBeenCalled();
	});

	it('falls back to the cloud token when the server token fails verification', async () => {
		jest.mocked(rsaVerifyJwt).mockRejectedValueOnce(new Error('JWT signature verification failed'));
		mockCloudFallback();

		const serverInfo = await getServerInfo(currentServer);

		expect(rsaVerifyJwt).toHaveBeenLastCalledWith(supportedVersionsKey, 'cloud-token');
		expect(serverInfo).toMatchObject({ success: true, supportedVersions: supportedVersionsPayload });
	});

	it('returns no supported versions when the cloud token also fails verification', async () => {
		jest.mocked(rsaVerifyJwt).mockRejectedValue(new Error('JWT signature verification failed'));
		mockCloudFallback();

		const serverInfo = await getServerInfo(currentServer);

		expect(serverInfo).toMatchObject({ success: true, supportedVersions: null });
	});

	it('skips verification when the server sends no token', async () => {
		mockServerInfo({});
		jest.mocked(getServerById).mockResolvedValue({ supportedVersionsUpdatedAt: new Date() } as any);

		await getServerInfo(currentServer);

		expect(rsaVerifyJwt).not.toHaveBeenCalled();
	});

	it('drops an unverified server token when the cloud was asked recently', async () => {
		jest.mocked(rsaVerifyJwt).mockRejectedValue(new Error('JWT signature verification failed'));
		mockServerInfo({ supportedVersions: { signed: 'forged-token' } });
		jest.mocked(getServerById).mockResolvedValue({ supportedVersionsUpdatedAt: new Date() } as any);

		const serverInfo = await getServerInfo(currentServer);

		expect(serverInfo).toMatchObject({ success: true, supportedVersions: null });
	});

	it('verifies again after a failed key import', async () => {
		mockServerInfo({ supportedVersions: { signed: 'server-token' } });
		jest.mocked(getServerById).mockResolvedValue({ supportedVersionsUpdatedAt: new Date() } as any);
		jest.mocked(rsaImportPublicKey).mockRejectedValueOnce(new Error('key import failed'));

		const afterFailedImport = await getServerInfo(currentServer);
		const afterRecoveredImport = await getServerInfo(currentServer);

		expect(afterFailedImport).toMatchObject({ success: true, supportedVersions: null });
		expect(afterRecoveredImport).toMatchObject({ success: true, supportedVersions: supportedVersionsPayload });
	});
});
