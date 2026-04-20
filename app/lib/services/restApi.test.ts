import type { ServerMediaSignal } from '@rocket.chat/media-signaling';
import { Platform } from 'react-native';

import { mediaCallsStateSignals } from './restApi';

const mockSdkGet = jest.fn();
const mockSdkPost = jest.fn();

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockSdkGet(...args),
		post: (...args: unknown[]) => mockSdkPost(...args)
	}
}));

jest.mock('../notifications', () => ({
	getDeviceToken: jest.fn()
}));

jest.mock('../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		getLastVoipToken: jest.fn()
	}
}));

jest.mock('react-native-device-info', () => {
	const mock = require('react-native-device-info/jest/react-native-device-info-mock');
	const getUniqueId = jest.fn(() => Promise.resolve('unique-device-id'));
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

function loadRegisterPushToken(platform: 'ios' | 'android' = 'android') {
	jest.resetModules();
	Object.defineProperty(Platform, 'OS', { configurable: true, writable: true, value: platform });
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const notifications = require('../notifications');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const voipNative = require('../native/NativeVoip').default;
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { registerPushToken } = require('./restApi');
	return {
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		registerPushToken: registerPushToken as typeof import('./restApi').registerPushToken,
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

	it('returns signals and success from the API response', async () => {
		const mockSignals = [
			{ type: 'new', callId: 'call-1' } as unknown as ServerMediaSignal,
			{ type: 'notification', notification: 'ringing' } as unknown as ServerMediaSignal
		];
		mockSdkGet.mockResolvedValueOnce({ signals: mockSignals, success: true });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toHaveLength(2);
		expect(result.success).toBe(true);
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
		mockSdkPost.mockResolvedValue(undefined);
	});

	it('returns early when there is no device push token', async () => {
		const { registerPushToken, getDeviceToken: getToken } = loadRegisterPushToken();
		getToken.mockReturnValue('');

		await registerPushToken();

		expect(mockSdkPost).not.toHaveBeenCalled();
	});

	it('on iOS registers apn payload without voipToken when VoIP token is missing', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios');
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
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('android');
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
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(1);
	});

	it('on iOS posts apn payload with voipToken when both tokens are present', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios');
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
});
