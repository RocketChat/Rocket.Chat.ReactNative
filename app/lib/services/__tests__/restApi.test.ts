import { Platform } from 'react-native';

import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';
import { mediaCallsStateSignals } from '../restApi';

const mockSdkGet = jest.fn();
const mockSdkPost = jest.fn();
const mockSdkDel = jest.fn();
let mockUniqueId: () => Promise<string> = () => Promise.resolve('unique-device-id');
let mockSdk!: SdkIntegration.IMockSdk;

jest.mock('../sdk', () => {
	const { makeSdkMock } = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
	mockSdk =
		mockSdk ??
		makeSdkMock({
			get: (...args: unknown[]) => mockSdkGet(...args),
			post: (...args: unknown[]) => mockSdkPost(...args),
			del: (...args: unknown[]) => mockSdkDel(...args)
		});
	return { __esModule: true, default: mockSdk };
});

const SDK_HOST = 'https://open.rocket.chat';
const OTHER_SDK_HOST = 'https://other.rocket.chat';

jest.mock('~/lib/notifications/deviceToken', () => ({
	getDeviceToken: jest.fn()
}));

jest.mock('~/lib/native/NativeVoip', () => ({
	__esModule: true,
	default: {
		getLastVoipToken: jest.fn()
	}
}));

jest.mock('react-native-device-info', () => {
	const mock = require('react-native-device-info/jest/react-native-device-info-mock');
	const getUniqueId = jest.fn(() => mockUniqueId());
	const defaultExport = {
		...mock,
		getUniqueId
	};
	return {
		__esModule: true,
		default: defaultExport,
		getUniqueId
	};
});

function loadPushTokenApi(platform: 'ios' | 'android' = 'android', mockServerVersion = '8.0.0') {
	jest.resetModules();
	Object.defineProperty(Platform, 'OS', { configurable: true, writable: true, value: platform });

	jest.doMock('~/lib/store/auxStore', () => ({
		store: {
			getState: () => ({
				server: { version: mockServerVersion }
			})
		}
	}));

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const notifications = require('~/lib/notifications/deviceToken');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const voipNative = require('~/lib/native/NativeVoip').default;
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
	const { registerPushToken, removePushToken, forgetRegisteredPushToken } = require('../restApi') as typeof import('../restApi');
	return {
		registerPushToken,
		removePushToken,
		forgetRegisteredPushToken,
		getDeviceToken: jest.mocked(notifications.getDeviceToken),
		getLastVoipToken: jest.mocked(voipNative.getLastVoipToken)
	};
}

describe('mediaCallsStateSignals', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls sdk.get with media-calls.stateSignals and the contractId', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: [], success: true });

		const result = await mediaCallsStateSignals('device-contract-id-123');

		expect(mockSdkGet).toHaveBeenCalledWith('media-calls.stateSignals', { contractId: 'device-contract-id-123' });
		expect(result).toEqual({ signals: [], success: true });
	});

	it('returns empty signals and success false when sdk.get throws', async () => {
		mockSdkGet.mockRejectedValueOnce(new Error('Network error'));

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toEqual([]);
		expect(result.success).toBe(false);
	});

	it('returns empty signals and success false when sdk.get returns an error response', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: [], success: false });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toEqual([]);
		expect(result.success).toBe(false);
	});
});

describe('registerPushToken', () => {
	const platformOsAtSuiteStart = Platform.OS;

	afterEach(() => {
		Object.defineProperty(Platform, 'OS', { configurable: true, writable: true, value: platformOsAtSuiteStart });
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockUniqueId = () => Promise.resolve('unique-device-id');
		mockSdkPost.mockResolvedValue(undefined);
		mockSdk.setClient({ host: SDK_HOST });
	});

	it('does not post when SDK is not initialized, and a later call after init posts', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		mockSdk.setClient(null);

		await registerPushToken();
		expect(mockSdkPost).not.toHaveBeenCalled();

		mockSdk.setClient({ host: SDK_HOST });
		await registerPushToken();
		expect(mockSdkPost).toHaveBeenCalledTimes(1);
	});

	it('returns early when there is no device push token', async () => {
		const { registerPushToken, getDeviceToken: getToken } = loadPushTokenApi();
		getToken.mockReturnValue('');

		await registerPushToken();

		expect(mockSdkPost).not.toHaveBeenCalled();
	});

	it('does not post a VoIP token without a device push token', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios', '8.4.0');
		getToken.mockReturnValue('');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		expect(mockSdkPost).not.toHaveBeenCalled();
	});

	it('posts both tokens again when a VoIP token arrives after the push token was registered', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios', '8.4.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('');
		await registerPushToken();

		getVoip.mockReturnValue('voip-token');
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
		expect(mockSdkPost).toHaveBeenLastCalledWith(
			'push.token',
			expect.objectContaining({ value: 'apns-token', voipToken: 'voip-token' })
		);
	});

	it('on iOS registers apn payload without voipToken when VoIP token is missing', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(1);
		expect(mockSdkPost).toHaveBeenCalledWith(
			'push.token',
			expect.objectContaining({
				id: 'unique-device-id',
				value: 'apns-token',
				type: 'apn',
				appName: expect.any(String)
			})
		);
		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});

	it('on Android still registers when VoIP token is missing', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('android');
		getToken.mockReturnValue('fcm-token');
		getVoip.mockReturnValue('');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(1);
		expect(mockSdkPost).toHaveBeenCalledWith(
			'push.token',
			expect.objectContaining({
				id: 'unique-device-id',
				value: 'fcm-token',
				type: 'gcm',
				appName: expect.any(String)
			})
		);
		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});

	it('dedupes when the same push and VoIP tokens are registered again', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(1);
	});

	it('on iOS posts apn payload with voipToken when both tokens are present', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios', '8.4.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledWith(
			'push.token',
			expect.objectContaining({
				id: 'unique-device-id',
				value: 'apns-token',
				type: 'apn',
				appName: expect.any(String),
				voipToken: 'voip-token'
			})
		);
	});

	it('on RC < 8.0 does not send id field', async () => {
		const { registerPushToken, getDeviceToken: getToken } = loadPushTokenApi('ios', '7.5.0');
		getToken.mockReturnValue('apns-token');

		await registerPushToken();

		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'id')).toBe(false);
	});

	it('on RC < 8.0 does not send voipToken field even when present', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios', '7.5.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});

	it('on RC 8.0-8.3 sends id but not voipToken', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios', '8.2.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledWith(
			'push.token',
			expect.objectContaining({
				id: 'unique-device-id'
			})
		);
		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});

	it('records the workspace the post went to when the user switches while the device id is read', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		const postedHosts: (string | null)[] = [];
		mockSdkPost.mockImplementation(() => {
			postedHosts.push(mockSdk.host);
			return Promise.resolve(undefined);
		});
		let resolveUniqueId!: (id: string) => void;
		mockUniqueId = () => new Promise(resolve => (resolveUniqueId = resolve));

		const registrationStartedOnA = registerPushToken();
		await new Promise(resolve => setImmediate(resolve));
		mockSdk.setClient({ host: OTHER_SDK_HOST });
		resolveUniqueId('unique-device-id');
		await registrationStartedOnA;
		mockUniqueId = () => Promise.resolve('unique-device-id');
		mockSdk.setClient({ host: SDK_HOST });
		await registerPushToken();

		expect(postedHosts).toEqual([OTHER_SDK_HOST, SDK_HOST]);
	});

	it('posts one registration at a time, so the newest token is the last one the server gets', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getVoip.mockReturnValue('');
		let resolvePost!: () => void;
		mockSdkPost.mockImplementationOnce(() => new Promise<void>(resolve => (resolvePost = resolve)));

		getToken.mockReturnValue('first-token');
		const loginRegistration = registerPushToken();
		await new Promise(resolve => setImmediate(resolve));
		getToken.mockReturnValue('refreshed-token');
		const refreshRegistration = registerPushToken();
		await new Promise(resolve => setImmediate(resolve));
		expect(mockSdkPost).toHaveBeenCalledTimes(1);

		resolvePost();
		await Promise.all([loginRegistration, refreshRegistration]);

		expect(mockSdkPost.mock.calls.map(([, data]) => data.value)).toEqual(['first-token', 'refreshed-token']);
	});

	it('registers the same token on every workspace the user signs in to', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();
		mockSdk.setClient({ host: OTHER_SDK_HOST });
		await registerPushToken();
		mockSdk.setClient({ host: SDK_HOST });
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});
});

describe('removePushToken', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSdkDel.mockResolvedValue({ success: true });
		mockSdk.setClient({ host: SDK_HOST });
	});

	it('deletes the device token on the server', async () => {
		const { removePushToken, getDeviceToken: getToken } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');

		await removePushToken();

		expect(mockSdkDel).toHaveBeenCalledWith('push.token', { token: 'apns-token' });
	});

	it('skips the delete when the device has no token', async () => {
		const { removePushToken, getDeviceToken: getToken } = loadPushTokenApi('ios');
		getToken.mockReturnValue('');

		await removePushToken();

		expect(mockSdkDel).not.toHaveBeenCalled();
	});

	it('skips the delete when there is no client', async () => {
		const { removePushToken, getDeviceToken: getToken } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		mockSdk.setClient(null);

		await removePushToken();

		expect(mockSdkDel).not.toHaveBeenCalled();
	});
});

describe('forgetRegisteredPushToken', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSdkPost.mockResolvedValue(undefined);
		mockSdk.setClient({ host: SDK_HOST });
	});

	const loadSignedInDevice = () => {
		const api = loadPushTokenApi('ios');
		api.getDeviceToken.mockReturnValue('apns-token');
		api.getLastVoipToken.mockReturnValue('voip-token');
		return api;
	};

	it('registers again on a workspace that was removed and added back', async () => {
		const { registerPushToken, forgetRegisteredPushToken } = loadSignedInDevice();
		await registerPushToken();

		forgetRegisteredPushToken(SDK_HOST);
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});

	it('keeps the registration of other workspaces', async () => {
		const { registerPushToken, forgetRegisteredPushToken } = loadSignedInDevice();
		await registerPushToken();
		mockSdk.setClient({ host: OTHER_SDK_HOST });
		await registerPushToken();

		forgetRegisteredPushToken(OTHER_SDK_HOST);
		mockSdk.setClient({ host: SDK_HOST });
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});

	it('registers again after a workspace is forgotten while its registration is in flight', async () => {
		const { registerPushToken, forgetRegisteredPushToken } = loadSignedInDevice();
		let resolvePost!: () => void;
		mockSdkPost.mockImplementationOnce(() => new Promise<void>(resolve => (resolvePost = resolve)));
		const inFlightRegistration = registerPushToken();
		await new Promise(resolve => setImmediate(resolve));

		forgetRegisteredPushToken(SDK_HOST);
		resolvePost();
		await inFlightRegistration;
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});
});
