import type { ServerMediaSignal } from '@rocket.chat/media-signaling';
import { Platform } from 'react-native';

import { findOrCreateInvite, mediaCallsStateSignals } from './restApi';

const mockSdkGet = jest.fn();
const mockSdkPost = jest.fn();
const mockSdkDelete = jest.fn();
let mockSdkCurrent: unknown = {};

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockSdkGet(...args),
		post: (...args: unknown[]) => mockSdkPost(...args),
		delete: (...args: unknown[]) => mockSdkDelete(...args),
		get current() {
			return mockSdkCurrent;
		}
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

jest.mock('../methods/subscribeRooms', () => ({
	unsubscribeRooms: jest.fn()
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

function loadRegisterPushToken(platform: 'ios' | 'android' = 'android', mockServerVersion = '8.0.0') {
	jest.resetModules();
	Object.defineProperty(Platform, 'OS', { configurable: true, writable: true, value: platform });

	jest.doMock('../store/auxStore', () => ({
		store: {
			getState: () => ({
				server: { version: mockServerVersion }
			})
		}
	}));

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

		expect(mockSdkGet).toHaveBeenCalledWith('/v1/media-calls.stateSignals', { contractId: 'device-contract-id-123' });
		expect(result).toEqual({ signals: [], success: true });
	});

	it('returns signals and success from the API response', async () => {
		const mockSignals = [
			{ type: 'new', callId: 'call-1' } as unknown as ServerMediaSignal,
			{ type: 'notification', notification: 'ringing' } as unknown as ServerMediaSignal
		];
		mockSdkGet.mockResolvedValueOnce({ signals: mockSignals, success: true });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.signals).toHaveLength(2);
	});

	it('returns empty signals and success false when sdk.get throws', async () => {
		mockSdkGet.mockRejectedValueOnce(new Error('Network error'));

		const result = await mediaCallsStateSignals('device-id');

		expect(result).toEqual({ signals: [], success: false });
	});

	it('returns empty signals and success false when sdk.get returns an error response', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: [], success: false });

		const result = await mediaCallsStateSignals('device-id');

		expect(result).toEqual({ signals: [], success: false });
	});
});

describe('findOrCreateInvite', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns an invite with a url field', async () => {
		mockSdkPost.mockResolvedValueOnce({
			success: true,
			_id: 'inv1',
			days: 1,
			maxUses: 0,
			rid: 'room1',
			url: 'https://example.com/invite/abc'
		});

		const invite = await findOrCreateInvite({ rid: 'room1', days: 1, maxUses: 0 });

		expect(mockSdkPost).toHaveBeenCalledWith('/v1/findOrCreateInvite', { rid: 'room1', days: 1, maxUses: 0 });
		expect(invite.success).toBe(true);
		if (!invite.success) return;
		expect(invite.url).toBe('https://example.com/invite/abc');
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
		mockSdkCurrent = {};
	});

	it('does not post when SDK is not initialized, and a later call after init posts', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		mockSdkCurrent = undefined;

		await registerPushToken();
		expect(mockSdkPost).not.toHaveBeenCalled();

		mockSdkCurrent = {};
		await registerPushToken();
		expect(mockSdkPost).toHaveBeenCalledTimes(1);
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
			'/v1/push.token',
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
			'/v1/push.token',
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
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios', '8.4.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledWith(
			'/v1/push.token',
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
		const { registerPushToken, getDeviceToken: getToken } = loadRegisterPushToken('ios', '7.5.0');
		getToken.mockReturnValue('apns-token');

		await registerPushToken();

		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'id')).toBe(false);
	});

	it('on RC < 8.0 does not send voipToken field even when present', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios', '7.5.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});

	it('on RC 8.0-8.3 sends id but not voipToken', async () => {
		const { registerPushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadRegisterPushToken('ios', '8.2.0');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledWith(
			'/v1/push.token',
			expect.objectContaining({
				id: 'unique-device-id'
			})
		);
		const payload = mockSdkPost.mock.calls[0][1] as Record<string, unknown>;
		expect(Object.prototype.hasOwnProperty.call(payload, 'voipToken')).toBe(false);
	});
});

describe('usersAutoComplete', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('JSON-stringifies the selector before sending it', () => {
		const { usersAutoComplete } = require('./restApi');
		usersAutoComplete({ term: 'abc', exceptions: [] });
		expect(mockSdkGet).toHaveBeenCalledWith('/v1/users.autocomplete', {
			selector: JSON.stringify({ term: 'abc', exceptions: [] })
		});
	});
});

describe('removePushToken', () => {
	beforeEach(() => {
		mockSdkDelete.mockResolvedValue({ success: true });
		(require('../notifications').getDeviceToken as jest.Mock).mockReturnValue('device-token');
	});

	it('sends a DELETE to /v1/push.token with the token in the body', async () => {
		const { removePushToken } = require('./restApi');
		const result = await removePushToken();
		expect(result).toBe(true);
		expect(mockSdkDelete).toHaveBeenCalledWith('/v1/push.token', { token: 'device-token' });
	});

	it('returns undefined and does not call delete when there is no device token', async () => {
		(require('../notifications').getDeviceToken as jest.Mock).mockReturnValue(undefined);
		const { removePushToken } = require('./restApi');
		expect(await removePushToken()).toBeUndefined();
		expect(mockSdkDelete).not.toHaveBeenCalled();
	});
});
