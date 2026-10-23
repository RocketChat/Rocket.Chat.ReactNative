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
	default: RCSSLPinning
} = require('../sslPinning') as typeof import('../sslPinning');

const HOST = 'https://mtls.rocket.chat';
const SIBLING = `${HOST}/sibling`;
const REMOVED = `${HOST}/removed`;
const OTHER_HOST = 'https://open.rocket.chat';

const setConnectedServer = (server: string | null) => Object.defineProperty(sdk, 'host', { value: server, configurable: true });
const storeServerCertificate = (server: string, name: string) => mockStore.set(`${CERTIFICATE_KEY}-${server}`, name);

describe('sslPinning on Android', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setConnectedServer(null);
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
		jest.mocked(getAllServers).mockResolvedValue([{ id: HOST }, { id: OTHER_HOST }] as TServerModel[]);

		await registerCertificates();

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledTimes(1);
		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('host-alias', HOST);
	});

	it('clears the stored and the native certificate when removing it', async () => {
		await RCSSLPinning?.removeCertificate(HOST);

		expect(mockStore.has(`${CERTIFICATE_KEY}-${HOST}`)).toBe(false);
		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('re-applies the certificate of a server that is not connected on the same host', async () => {
		storeServerCertificate(REMOVED, 'removed-alias');
		setConnectedServer(OTHER_HOST);

		await RCSSLPinning?.removeCertificate(REMOVED);

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('host-alias', HOST);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalledWith('removed-alias', REMOVED);
	});

	it('re-applies the connected server last', async () => {
		storeServerCertificate(SIBLING, 'sibling-alias');
		storeServerCertificate(REMOVED, 'removed-alias');
		setConnectedServer(HOST);

		await RCSSLPinning?.removeCertificate(REMOVED);

		expect(jest.mocked(NativeSSLPinningAndroid.setCertificate).mock.calls).toEqual([
			['sibling-alias', SIBLING],
			['host-alias', HOST]
		]);
	});

	it('leaves servers on other hosts alone', async () => {
		storeServerCertificate(OTHER_HOST, 'other-alias');

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

	beforeAll(() => {
		Object.defineProperty(Platform, 'select', {
			value: (options: { ios?: unknown }) => options.ios,
			configurable: true
		});
		const { NativeModules } = jest.requireActual<typeof import('react-native')>('react-native');
		NativeModules.SSLPinning = nativeSSLPinning;
		jest.isolateModules(() => {
			RCSSLPinningIOS = (require('../sslPinning') as typeof import('../sslPinning')).default;
		});
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockStore.clear();
		setConnectedServer(null);
		storeServerCertificate(HOST, 'client.p12');
		mockStore.set('client.p12', certificate);
		mockStore.set('mtls.rocket.chat', certificate);
	});

	it('restores the host certificate of a server that is not connected', async () => {
		storeServerCertificate(REMOVED, 'removed.p12');
		mockStore.set('removed.p12', { path: '/removed.p12', password: 'other' });
		setConnectedServer(OTHER_HOST);

		await RCSSLPinningIOS?.removeCertificate(REMOVED);

		expect(mockStore.get('mtls.rocket.chat')).toEqual(expect.objectContaining({ password: 'secret' }));
		expect(mockStore.has('removed.p12')).toBe(false);
		expect(nativeSSLPinning.setCertificate).toHaveBeenCalledWith(HOST, '/client.p12', 'secret');
	});

	it('keeps a certificate entry another server still uses', async () => {
		storeServerCertificate(REMOVED, 'client.p12');

		await RCSSLPinningIOS?.removeCertificate(REMOVED);

		expect(mockStore.get('client.p12')).toEqual(expect.objectContaining({ password: 'secret' }));
		expect(mockStore.get('mtls.rocket.chat')).toEqual(expect.objectContaining({ password: 'secret' }));
	});

	it('removes a certificate entry and host entry no other server uses', async () => {
		await RCSSLPinningIOS?.removeCertificate(HOST);

		expect(mockStore.has('client.p12')).toBe(false);
		expect(mockStore.has('mtls.rocket.chat')).toBe(false);
	});
});
