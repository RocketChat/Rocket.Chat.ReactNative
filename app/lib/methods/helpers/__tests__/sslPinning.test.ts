const mockStore = new Map<string, unknown>();

jest.mock('~/lib/database/services/Server', () => ({
	getAllServers: jest.fn()
}));

const mockSelectedServer = { server: '' };

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => ({ server: mockSelectedServer }) }
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
import { Platform } from 'react-native';

import { type TServerModel } from '~/definitions/IServer';

import { CERTIFICATE_KEY, CURRENT_SERVER } from '~/lib/constants/keys';

Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
Object.defineProperty(Platform, 'select', {
	value: (options: { android?: unknown }) => options.android,
	configurable: true
});

const {
	applyServerCertificate,
	getServerCertificate,
	registerCertificates,
	clearRemovedWorkspaceCertificate,
	default: RCSSLPinning
} = require('../sslPinning') as typeof import('../sslPinning');

const HOSTNAME = 'mtls.rocket.chat';
const HOST = `https://${HOSTNAME}`;
const SIBLING = `${HOST}/sibling`;
const REMOVED = `${HOST}/removed`;
const OTHER_HOST = 'https://open.rocket.chat';

const setSelectedServer = (server: string) => {
	mockSelectedServer.server = server;
};
const storeServerCertificate = (server: string, name: string) => mockStore.set(`${CERTIFICATE_KEY}-${server}`, name);
const setDatabaseServers = (...ids: string[]) =>
	jest.mocked(getAllServers).mockResolvedValue(ids.map(id => ({ id })) as TServerModel[]);

describe('sslPinning on Android', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setSelectedServer('');
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

	it('registers one certificate per host', async () => {
		storeServerCertificate(OTHER_HOST, 'other-alias');
		setDatabaseServers(HOST, OTHER_HOST);

		await registerCertificates();

		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([
			['host-alias', HOST],
			['other-alias', OTHER_HOST]
		]);
	});

	it('registers the last active server of a host before anything is connected', async () => {
		storeServerCertificate(SIBLING, 'sibling-alias');
		mockStore.set(CURRENT_SERVER, SIBLING);
		setDatabaseServers(HOST, SIBLING);

		await registerCertificates();

		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([['sibling-alias', SIBLING]]);
	});

	it('registers the selected workspace of a host, even when another one was active last', async () => {
		storeServerCertificate(SIBLING, 'sibling-alias');
		mockStore.set(CURRENT_SERVER, SIBLING);
		setSelectedServer(HOST);
		setDatabaseServers(SIBLING, HOST);

		await registerCertificates();

		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([['host-alias', HOST]]);
	});

	it('logs instead of throwing when a certificate cannot be applied', async () => {
		const error = new Error('KeyChain unavailable');
		jest.mocked(NativeSSLPinningAndroid.setCertificate).mockRejectedValueOnce(error);

		await expect(applyServerCertificate(HOST)).resolves.toBeUndefined();
		expect(log).toHaveBeenCalledWith(error);
	});

	it('clears the stored and the native certificate when no server is left on the host', async () => {
		await RCSSLPinning?.removeCertificate(HOST);

		expect(getServerCertificate(HOST)).toBeNull();
		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('keeps the host certificate and re-applies the connected workspace on the host', async () => {
		storeServerCertificate(SIBLING, 'sibling-alias');
		storeServerCertificate(REMOVED, 'removed-alias');
		setDatabaseServers(SIBLING, HOST);
		setSelectedServer(HOST);

		await RCSSLPinning?.removeCertificate(REMOVED);

		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([['host-alias', HOST]]);
	});

	it('keeps the host certificate for a workspace on the host without one of its own', async () => {
		setDatabaseServers(SIBLING);

		await clearRemovedWorkspaceCertificate(HOST);

		expect(getServerCertificate(HOST)).toBeNull();
		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
	});

	it('clears the host certificate when it is removed by hand, even if a workspace on the host has none', async () => {
		setDatabaseServers(SIBLING);

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
	});

	it('leaves the host certificate alone when removing one that was never saved', async () => {
		setDatabaseServers(SIBLING);

		await RCSSLPinning?.removeCertificate(REMOVED);

		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
	});

	it('keeps the certificate of a workspace that is still in the database', async () => {
		setDatabaseServers(HOST);

		await clearRemovedWorkspaceCertificate(HOST);

		expect(getServerCertificate(HOST)).toBe('host-alias');
		expect(NativeSSLPinningAndroid.removeCertificate).not.toHaveBeenCalled();
	});

	it('ignores the stored certificates of logged out servers', async () => {
		storeServerCertificate(SIBLING, 'logged-out-alias');

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('clears the native certificate when the last workspace on a host had none of its own', async () => {
		await clearRemovedWorkspaceCertificate(SIBLING);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(SIBLING);
	});

	it('leaves servers on other hosts alone', async () => {
		storeServerCertificate(OTHER_HOST, 'other-alias');
		setDatabaseServers(OTHER_HOST);

		await RCSSLPinning?.removeCertificate(HOST);

		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
	});

	it('logs instead of throwing when the servers cannot be read', async () => {
		const error = new Error('database unavailable');
		jest.mocked(getAllServers).mockRejectedValue(error);

		await expect(registerCertificates()).resolves.toBeUndefined();
		expect(log).toHaveBeenCalledWith(error);
	});
});

describe('sslPinning on iOS', () => {
	const nativeSSLPinning = { setCertificate: jest.fn(), removeWatchCertificate: jest.fn() };
	const certificate = { path: '/client.p12', password: 'secret' };
	let RCSSLPinningIOS: typeof RCSSLPinning;
	let clearRemovedWorkspaceCertificateIOS: typeof clearRemovedWorkspaceCertificate;
	let getServerCertificateIOS: typeof getServerCertificate;

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
			clearRemovedWorkspaceCertificateIOS = sslPinning.clearRemovedWorkspaceCertificate;
			getServerCertificateIOS = sslPinning.getServerCertificate;
		});
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setSelectedServer('');
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

	it('keeps a certificate entry a server on another host still uses', async () => {
		storeServerCertificate(OTHER_HOST, 'client.p12');
		setDatabaseServers(OTHER_HOST);

		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.get('client.p12')).toEqual(certificate);
		expect(nativeSSLPinning.setCertificate).not.toHaveBeenCalled();
	});

	it('keeps the host entry for a workspace on the host without a certificate of its own', async () => {
		setDatabaseServers(SIBLING);

		await clearRemovedWorkspaceCertificateIOS(HOST);

		expect(getServerCertificateIOS(HOST)).toBeNull();
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

	it('leaves the host entry alone when removing a workspace without a certificate of its own', async () => {
		setDatabaseServers(HOST);

		await clearRemovedWorkspaceCertificateIOS(SIBLING);

		expect(mockStore.get(HOSTNAME)).toEqual(certificate);
		expect(nativeSSLPinning.setCertificate).not.toHaveBeenCalled();
	});

	it('clears the Watch copy of a certificate removed by hand', async () => {
		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(nativeSSLPinning.removeWatchCertificate).toHaveBeenCalledWith(HOST);
	});

	it('clears the Watch copy of a removed workspace certificate', async () => {
		setDatabaseServers(SIBLING);

		await clearRemovedWorkspaceCertificateIOS(HOST);

		expect(nativeSSLPinning.removeWatchCertificate).toHaveBeenCalledWith(HOST);
	});

	it('clears the host entry of a certificate picked for another address on the host', async () => {
		await RCSSLPinningIOS?.removeCertificate(SIBLING);

		expect(mockStore.has(HOSTNAME)).toBe(false);
	});

	it('clears the host entry when the remaining server on the host has lost its certificate entry', async () => {
		storeServerCertificate(SIBLING, 'deleted.p12');
		setDatabaseServers(SIBLING);

		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.has(HOSTNAME)).toBe(false);
	});

	it('clears the host entry when the last workspace on a host had none of its own', async () => {
		await clearRemovedWorkspaceCertificateIOS(SIBLING);

		expect(mockStore.has(HOSTNAME)).toBe(false);
	});
});
