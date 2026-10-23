jest.mock('~/lib/native/NativeSSLPinningAndroid', () => ({
	__esModule: true,
	default: {
		setCertificate: jest.fn(() => Promise.resolve(null)),
		removeCertificate: jest.fn(),
		pickCertificate: jest.fn()
	}
}));

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
		getString: jest.fn(),
		getMap: jest.fn(),
		setMap: jest.fn(),
		setString: jest.fn(),
		getAllKeys: jest.fn(() => []),
		removeItem: jest.fn()
	}
}));

import NativeSSLPinningAndroid from '~/lib/native/NativeSSLPinningAndroid';
import { getAllServers } from '~/lib/database/services/Server';
import log from '~/lib/methods/helpers/log';
import UserPreferences from '~/lib/methods/userPreferences';
import sdk from '~/lib/services/sdk';
import { Platform } from 'react-native';

import { type TServerModel } from '~/definitions';

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

const WITH_CERTIFICATE = 'https://mtls.rocket.chat';
const WITHOUT_CERTIFICATE = 'https://open.rocket.chat';

describe('sslPinning on Android', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(UserPreferences.getAllKeys).mockReturnValue([]);
		Object.defineProperty(sdk, 'host', { value: null, configurable: true });
		jest
			.mocked(UserPreferences.getString)
			.mockImplementation(key => (key === `${CERTIFICATE_KEY}-${WITH_CERTIFICATE}` ? 'client-alias' : null));
	});

	it('applies the stored certificate of a server', async () => {
		await applyServerCertificate(WITH_CERTIFICATE);

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('client-alias', WITH_CERTIFICATE);
	});

	it('skips a server without a stored certificate', async () => {
		await applyServerCertificate(WITHOUT_CERTIFICATE);

		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('registers the certificate of every server that has one', async () => {
		jest.mocked(getAllServers).mockResolvedValue([{ id: WITH_CERTIFICATE }, { id: WITHOUT_CERTIFICATE }] as TServerModel[]);

		await registerCertificates();

		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledTimes(1);
		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('client-alias', WITH_CERTIFICATE);
	});

	it('clears the stored and the native certificate when removing it', async () => {
		await RCSSLPinning?.removeCertificate(WITH_CERTIFICATE);

		expect(UserPreferences.removeItem).toHaveBeenCalledWith(`${CERTIFICATE_KEY}-${WITH_CERTIFICATE}`);
		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(WITH_CERTIFICATE);
		expect(NativeSSLPinningAndroid.setCertificate).not.toHaveBeenCalled();
	});

	it('restores the connected server certificate after removing one on the same host', async () => {
		Object.defineProperty(sdk, 'host', { value: WITH_CERTIFICATE, configurable: true });

		await RCSSLPinning?.removeCertificate(`${WITH_CERTIFICATE}/other`);

		expect(NativeSSLPinningAndroid.removeCertificate).toHaveBeenCalledWith(`${WITH_CERTIFICATE}/other`);
		expect(NativeSSLPinningAndroid.setCertificate).toHaveBeenCalledWith('client-alias', WITH_CERTIFICATE);
	});

	it('keeps a certificate file another server still uses', async () => {
		const other = `${WITH_CERTIFICATE}/other`;
		jest
			.mocked(UserPreferences.getAllKeys)
			.mockReturnValue([`${CERTIFICATE_KEY}-${WITH_CERTIFICATE}`, `${CERTIFICATE_KEY}-${other}`]);
		jest.mocked(UserPreferences.getString).mockReturnValue('client-alias');

		await RCSSLPinning?.removeCertificate(WITH_CERTIFICATE);

		expect(UserPreferences.removeItem).not.toHaveBeenCalledWith('client-alias');
	});

	it('removes a certificate file no other server uses', async () => {
		await RCSSLPinning?.removeCertificate(WITH_CERTIFICATE);

		expect(UserPreferences.removeItem).toHaveBeenCalledWith('client-alias');
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
		jest
			.mocked(UserPreferences.getString)
			.mockImplementation(key => (key === `${CERTIFICATE_KEY}-${WITH_CERTIFICATE}` ? 'client.p12' : null));
		jest
			.mocked(UserPreferences.getMap)
			.mockImplementation(key => (key === 'client.p12' ? { path: '/client.p12', password: 'secret' } : null));
	});

	it('restores the connected server certificate after removing one on the same host', async () => {
		Object.defineProperty(sdk, 'host', { value: WITH_CERTIFICATE, configurable: true });

		await RCSSLPinningIOS?.removeCertificate(`${WITH_CERTIFICATE}/other`);

		expect(UserPreferences.removeItem).toHaveBeenCalledWith('mtls.rocket.chat');
		expect(UserPreferences.setMap).toHaveBeenCalledWith('mtls.rocket.chat', expect.objectContaining({ password: 'secret' }));
		expect(nativeSSLPinning.setCertificate).toHaveBeenCalledWith(WITH_CERTIFICATE, expect.any(String), 'secret');
	});
});
