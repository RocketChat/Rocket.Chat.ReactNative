import type * as ExpoNotifications from 'expo-notifications';

// Mock the dependencies before importing push.ts
jest.mock('expo-notifications');
jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));
jest.mock('../services/restApi', () => ({
	registerPushToken: jest.fn().mockResolvedValue(undefined)
}));

// Use jest.isolateModules to get a fresh copy of push.ts per test,
// resetting the module-level `configured = false` flag each time.
let pushNotificationConfigure: (onNotification: jest.Mock) => Promise<any>;
let Notifications: typeof ExpoNotifications;
let reduxStore: { getState: jest.Mock };
let registerPushToken: jest.Mock;

const baseState = {
	login: { isAuthenticated: false },
	server: { version: '8.0.0', server: 'https://open.rocket.chat' },
	app: { background: false }
};

// Helper to set up a fresh push module within isolateModules
const setupPushModule = () => {
	jest.isolateModules(() => {
		jest.doMock('expo-notifications', () => ({
			__esModule: true,
			getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
			getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
			requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
			setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
			dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
			setNotificationHandler: jest.fn(),
			setNotificationCategoryAsync: jest.fn(() => Promise.resolve()),
			addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
			addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
			addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
			getLastNotificationResponse: jest.fn(() => null),
			DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT'
		}));
		jest.doMock('../store/auxStore', () => ({
			store: {
				getState: jest.fn(() => baseState)
			}
		}));
		jest.doMock('../services/restApi', () => ({
			registerPushToken: jest.fn().mockResolvedValue(undefined)
		}));

		Notifications = require('expo-notifications');
		reduxStore = require('../store/auxStore').store;
		registerPushToken = require('../services/restApi').registerPushToken;
		const pushModule = require('./push');
		pushNotificationConfigure = pushModule.pushNotificationConfigure;
	});
};

describe('push.ts auth guard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Notifications.addPushTokenListener callback', () => {
		it('does NOT call registerPushToken when user is not authenticated', async () => {
			setupPushModule();
			(reduxStore.getState as jest.Mock).mockReturnValue(baseState);

			await pushNotificationConfigure(jest.fn());

			const registeredCallbacks = (Notifications.addPushTokenListener as jest.Mock).mock.calls;
			expect(registeredCallbacks.length).toBe(1);

			const listener = registeredCallbacks[0][0];
			await listener({ data: 'refreshed-token' });

			// Auth guard should have blocked the call
			expect(registerPushToken).not.toHaveBeenCalled();
		});
	});

	describe('Notifications.addPushTokenListener callback (authenticated)', () => {
		it('calls registerPushToken when user IS authenticated', async () => {
			setupPushModule();
			(reduxStore.getState as jest.Mock).mockReturnValue({
				...baseState,
				login: { isAuthenticated: true }
			});

			await pushNotificationConfigure(jest.fn());

			const registeredCallbacks = (Notifications.addPushTokenListener as jest.Mock).mock.calls;
			expect(registeredCallbacks.length).toBe(1);

			const listener = registeredCallbacks[0][0];
			await listener({ data: 'refreshed-token' });

			expect(registerPushToken).toHaveBeenCalledTimes(1);
		});
	});

	describe('initial registerForPushNotifications().then(...) branch', () => {
		it('does NOT call registerPushToken when user is not authenticated (initial token acquisition)', async () => {
			setupPushModule();
			(reduxStore.getState as jest.Mock).mockReturnValue(baseState);

			// The .then() callback fires after registerForPushNotifications() resolves;
			// at that moment isAuthenticated is false, so the guard returns early.
			await pushNotificationConfigure(jest.fn());

			expect(registerPushToken).not.toHaveBeenCalled();
		});
	});
});
