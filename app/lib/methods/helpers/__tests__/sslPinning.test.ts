const mockStore = new Map<string, unknown>();

jest.mock('~/lib/database/services/Server', () => ({
	getAllServers: jest.fn()
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { host: null }
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: (key: string) => mockStore.get(key) ?? null,
		getMap: (key: string) => mockStore.get(key) ?? null,
		setString: (key: string, value: unknown) => mockStore.set(key, value),
		setMap: (key: string, value: unknown) => mockStore.set(key, value),
		getAllKeys: () => [...mockStore.keys()],
		removeItem: (key: string) => mockStore.delete(key)
	}
}));

import NativeSSLPinningAndroid from '~/lib/native/NativeSSLPinningAndroid';
import { getAllServers } from '~/lib/database/services/Server';
import log from '~/lib/methods/helpers/log';
import sdk from '~/lib/services/sdk';
import { Platform } from 'react-native';

import { type TServerModel } from '~/definitions/IServer';

import { CERTIFICATE_KEY } from '~/lib/constants/keys';

Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
Object.defineProperty(Platform, 'select', {
	value: (options: { android?: unknown }) => options.android,
	configurable: true
});

const {
	applyServerCertificate,
	registerCertificates,
	removeWorkspaceCertificate,
	default: RCSSLPinning
} = require('../sslPinning') as typeof import('../sslPinning');

const HOSTNAME = 'mtls.rocket.chat';
const HOST = `https://${HOSTNAME}`;
const SIBLING = `${HOST}/sibling`;
const REMOVED = `${HOST}/removed`;
const OTHER_HOST = 'https://open.rocket.chat';

const setConnectedServer = (server: string | null) => Object.defineProperty(sdk, 'host', { value: server, configurable: true });
const storeServerCertificate = (server: string, name: string) => mockStore.set(`${CERTIFICATE_KEY}-${server}`, name);
const setDatabaseServers = (...ids: string[]) =>
	jest.mocked(getAllServers).mockResolvedValue(ids.map(id => ({ id })) as TServerModel[]);

describe('sslPinning on Android', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setConnectedServer(null);
		setDatabaseServers();
		storeServerCertificate(HOST, 'host-alias');
	});

	it('applies the stored certificate of a server', async () => {
		await applyServerCertificate(HOST);

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('host-alias', HOST);
	});

	it('skips a server without a stored certificate', async () => {
		await applyServerCertificate(OTHER_HOST);

		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('registers the certificate of every server that has one', async () => {
		setDatabaseServers(HOST, OTHER_HOST);

		await registerCertificates();

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledTimes(1);
		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('host-alias', HOST);
	});

	it('clears the stored and the native certificate when no server is left on the host', async () => {
		await RCSSLPinning?.removeCertificate(HOST);

		expect(mockStore.has(`${CERTIFICATE_KEY}-${HOST}`)).toBe(false);
		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('keeps the host certificate and re-applies the remaining servers, connected last', async () => {
		storeServerCertificate(SIBLING, 'sibling-alias');
		storeServerCertificate(REMOVED, 'removed-alias');
		setDatabaseServers(HOST, SIBLING);
		setConnectedServer(HOST);

		await RCSSLPinning?.removeCertificate(REMOVED);

		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([
			['sibling-alias', SIBLING],
			['host-alias', HOST]
		]);
	});

	it('keeps the host certificate for a workspace on the host without one of its own', async () => {
		setDatabaseServers(SIBLING);

		await removeWorkspaceCertificate(HOST);

		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
	});

	it('clears the host certificate when it is removed by hand, even if a workspace on the host has none', async () => {
		setDatabaseServers(SIBLING);

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
	});

	it('keeps the certificate of a workspace that is still in the database', async () => {
		setDatabaseServers(HOST);

		await removeWorkspaceCertificate(HOST);

		expect(mockStore.get(`${CERTIFICATE_KEY}-${HOST}`)).toBe('host-alias');
		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
	});

	it('ignores stored certificates of servers that are not in the database', async () => {
		storeServerCertificate(SIBLING, 'stale-alias');

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('clears the native certificate when the last server on the host has none of its own', async () => {
		await RCSSLPinning?.removeCertificate(SIBLING);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(SIBLING);
	});

	it('leaves servers on other hosts alone', async () => {
		storeServerCertificate(OTHER_HOST, 'other-alias');
		setDatabaseServers(OTHER_HOST);

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('logs instead of throwing when the servers cannot be read', async () => {
		const error = new Error('database unavailable');
		jest.mocked(getAllServers).mockRejectedValue(error);

		await expect(registerCertificates()).resolves.toBeUndefined();
		expect(log).toHaveBeenCalledWith(error);
	});
});

describe('sslPinning on iOS', () => {
	const nativeSSLPinning = { setCertificate: jest.fn() };
	const certificate = { path: '/client.p12', password: 'secret' };
	let RCSSLPinningIOS: typeof RCSSLPinning;
	let removeWorkspaceCertificateIOS: typeof removeWorkspaceCertificate;

	beforeAll(() => {
		Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
		Object.defineProperty(Platform, 'select', {
			value: (options: { ios?: unknown }) => options.ios,
			configurable: true
		});
		const { NativeModules } = jest.requireActual<typeof import('react-native')>('react-native');
		NativeModules.SSLPinning = nativeSSLPinning;
		jest.isolateModules(() => {
			const sslPinning = require('../sslPinning') as typeof import('../sslPinning');
			RCSSLPinningIOS = sslPinning.default;
			removeWorkspaceCertificateIOS = sslPinning.removeWorkspaceCertificate;
		});
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setConnectedServer(null);
		setDatabaseServers();
		storeServerCertificate(HOST, 'client.p12');
		mockStore.set('client.p12', certificate);
		mockStore.set(HOSTNAME, certificate);
	});

	it('restores the host entry from a remaining server on the host', async () => {
		storeServerCertificate(REMOVED, 'removed.p12');
		mockStore.set('removed.p12', { path: '/removed.p12', password: 'other' });
		mockStore.set(HOSTNAME, mockStore.get('removed.p12'));
		setDatabaseServers(HOST);

		await RCSSLPinningIOS?.removeCertificate(REMOVED);

		expect(mockStore.get(HOSTNAME)).toEqual(expect.objectContaining({ password: 'secret' }));
		expect(mockStore.has('removed.p12')).toBe(false);
		expect(nativeSSLPinning.setCertificate).toHaveBeenCalledWith(HOST, '/client.p12', 'secret');
	});

	it('keeps a certificate entry another server still uses', async () => {
		storeServerCertificate(REMOVED, 'client.p12');
		setDatabaseServers(HOST);

		await RCSSLPinningIOS?.removeCertificate(REMOVED);

		expect(mockStore.get('client.p12')).toEqual(expect.objectContaining({ password: 'secret' }));
	});

	it('keeps the host entry for a workspace on the host without a certificate of its own', async () => {
		setDatabaseServers(SIBLING);

		await removeWorkspaceCertificateIOS(HOST);

		expect(mockStore.get(HOSTNAME)).toEqual(certificate);
	});

	it('clears the host entry when the certificate is removed by hand, even if a workspace on the host has none', async () => {
		setDatabaseServers(SIBLING);

		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.has(HOSTNAME)).toBe(false);
	});

	it('removes the certificate and host entries when no server is left on the host', async () => {
		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.has('client.p12')).toBe(false);
		expect(mockStore.has(HOSTNAME)).toBe(false);
		expect(nativeSSLPinning.setCertificate).not.toHaveBeenCalled();
	});

	it('keeps a certificate entry a logged out server still points to', async () => {
		storeServerCertificate(SIBLING, 'client.p12');

		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.get('client.p12')).toEqual(certificate);
		expect(mockStore.has(HOSTNAME)).toBe(false);
	});

	it('clears the host entry when the last server on the host has no certificate of its own', async () => {
		await RCSSLPinningIOS?.removeCertificate(SIBLING);

		expect(mockStore.has(HOSTNAME)).toBe(false);
	});
});
