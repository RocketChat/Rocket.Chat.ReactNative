import { Platform } from 'react-native';

import { SubscriptionType } from '~/definitions';
import type * as SdkIntegration from '../testUtils/sdkIntegration';
import { mediaCallsStateSignals } from './restApi';

const mockSdkGet = jest.fn();
const mockSdkPost = jest.fn();
const mockSdkDel = jest.fn();
const mockSdkMethodCallWrapper = jest.fn();
let mockSdk!: SdkIntegration.IMockSdk;

jest.mock('./sdk', () => {
	const { makeSdkMock } = jest.requireActual<typeof SdkIntegration>('../testUtils/sdkIntegration');
	mockSdk =
		mockSdk ??
		makeSdkMock({
			get: (...args: unknown[]) => mockSdkGet(...args),
			post: (...args: unknown[]) => mockSdkPost(...args),
			del: (...args: unknown[]) => mockSdkDel(...args),
			methodCallWrapper: (...args: unknown[]) => mockSdkMethodCallWrapper(...args)
		});
	return { __esModule: true, default: mockSdk };
});

const SDK_HOST = 'https://open.rocket.chat';

jest.mock('../notifications/deviceToken', () => ({
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

function loadPushTokenApi(platform: 'ios' | 'android' = 'android', mockServerVersion = '8.0.0') {
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
	const notifications = require('../notifications/deviceToken');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const voipNative = require('../native/NativeVoip').default;
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { registerPushToken, removePushToken } = require('./restApi');
	return {
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		registerPushToken: registerPushToken as typeof import('./restApi').registerPushToken,
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		removePushToken: removePushToken as typeof import('./restApi').removePushToken,
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
});

describe('removePushToken', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSdkPost.mockResolvedValue(undefined);
		mockSdkDel.mockResolvedValue({ success: true });
		mockSdk.setClient({ host: SDK_HOST });
	});

	it('deletes the token on the server and forgets the registered tokens', async () => {
		const { registerPushToken, removePushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		await registerPushToken();
		expect(mockSdkPost).toHaveBeenCalledTimes(1);

		await removePushToken();
		expect(mockSdkDel).toHaveBeenCalledWith('push.token', { token: 'apns-token' });

		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});

	it('keeps the registered tokens when the device token is already gone', async () => {
		const { registerPushToken, removePushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		await registerPushToken();
		expect(mockSdkPost).toHaveBeenCalledTimes(1);

		getToken.mockReturnValue('');
		await removePushToken();
		expect(mockSdkDel).not.toHaveBeenCalled();

		getToken.mockReturnValue('apns-token');
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(1);
	});

	it('forgets the registered tokens even when there is no client to delete them from', async () => {
		const { registerPushToken, removePushToken, getDeviceToken: getToken, getLastVoipToken: getVoip } = loadPushTokenApi('ios');
		getToken.mockReturnValue('apns-token');
		getVoip.mockReturnValue('voip-token');
		await registerPushToken();
		expect(mockSdkPost).toHaveBeenCalledTimes(1);

		mockSdk.setClient(null);
		await removePushToken();
		expect(mockSdkDel).not.toHaveBeenCalled();

		mockSdk.setClient({ host: SDK_HOST });
		await registerPushToken();

		expect(mockSdkPost).toHaveBeenCalledTimes(2);
	});
});

function loadGetRoomMembers(mockServerVersion: string) {
	jest.resetModules();
	jest.doMock('../store/auxStore', () => ({
		store: {
			getState: () => ({
				server: { version: mockServerVersion }
			})
		}
	}));
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { getRoomMembers } = require('./restApi');
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	return getRoomMembers as typeof import('./restApi').getRoomMembers;
}

describe('getRoomMembers', () => {
	const members = [{ _id: 'owner-id', username: 'owner', roles: ['owner'] }];
	const baseParams = {
		rid: 'room-id',
		allUsers: true,
		type: 'all' as const,
		filter: '',
		skip: 0,
		limit: 25
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockSdkGet.mockResolvedValue({ success: true, members });
		mockSdkMethodCallWrapper.mockResolvedValue({ records: members });
	});

	it.each([SubscriptionType.CHANNEL, SubscriptionType.GROUP])(
		'uses rooms.membersOrderedByRole for room type %s on 7.3.0',
		async roomType => {
			const getRoomMembers = loadGetRoomMembers('7.3.0');

			const result = await getRoomMembers({ ...baseParams, roomType });

			expect(mockSdkGet).toHaveBeenCalledTimes(1);
			expect(mockSdkGet).toHaveBeenCalledWith('rooms.membersOrderedByRole', { roomId: 'room-id', offset: 0, count: 25 });
			expect(result).toEqual(members);
		}
	);

	it('passes status and filter to rooms.membersOrderedByRole', async () => {
		const getRoomMembers = loadGetRoomMembers('8.0.0');

		await getRoomMembers({
			...baseParams,
			roomType: SubscriptionType.CHANNEL,
			type: 'online',
			allUsers: false,
			filter: 'john',
			skip: 50
		});

		expect(mockSdkGet).toHaveBeenCalledWith('rooms.membersOrderedByRole', {
			roomId: 'room-id',
			offset: 50,
			count: 25,
			'status[]': 'online',
			filter: 'john'
		});
	});

	it('keeps using im.members for direct messages', async () => {
		const getRoomMembers = loadGetRoomMembers('8.0.0');

		await getRoomMembers({ ...baseParams, roomType: SubscriptionType.DIRECT });

		expect(mockSdkGet).toHaveBeenCalledTimes(1);
		expect(mockSdkGet).toHaveBeenCalledWith('im.members', { roomId: 'room-id', offset: 0, count: 25 });
	});

	it('uses channels.members on servers older than 7.3.0', async () => {
		const getRoomMembers = loadGetRoomMembers('7.2.0');

		await getRoomMembers({ ...baseParams, roomType: SubscriptionType.CHANNEL });

		expect(mockSdkGet).toHaveBeenCalledTimes(1);
		expect(mockSdkGet).toHaveBeenCalledWith('channels.members', { roomId: 'room-id', offset: 0, count: 25 });
	});

	it('uses getUsersOfRoom on servers older than 3.16.0', async () => {
		const getRoomMembers = loadGetRoomMembers('3.15.0');

		const result = await getRoomMembers({ ...baseParams, roomType: SubscriptionType.CHANNEL });

		expect(mockSdkGet).not.toHaveBeenCalled();
		expect(mockSdkMethodCallWrapper).toHaveBeenCalledWith('getUsersOfRoom', 'room-id', true, { skip: 0, limit: 25 });
		expect(result).toEqual(members);
	});
});
