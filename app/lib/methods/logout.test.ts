/* eslint-disable import/first */
jest.mock('@rocket.chat/ddp-client', () => ({
	DDPSDK: {
		createAndConnect: jest.fn()
	}
}));

jest.mock('./userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn(),
		setString: jest.fn(),
		removeItem: jest.fn()
	}
}));

jest.mock('../notifications', () => ({
	getDeviceToken: jest.fn()
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn(() => ({
				find: jest.fn().mockRejectedValue(new Error('not found'))
			})),
			write: jest.fn(),
			batch: jest.fn()
		}
	},
	getDatabase: jest.fn(() => ({
		write: jest.fn(),
		unsafeResetDatabase: jest.fn()
	}))
}));

jest.mock('../services/connect', () => ({
	disconnect: jest.fn()
}));

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		current: undefined,
		logout: jest.fn()
	}
}));

jest.mock('../services/restApi', () => ({
	removePushToken: jest.fn()
}));

jest.mock('./subscriptions/rooms', () => ({
	roomsSubscription: {
		stop: jest.fn()
	}
}));

jest.mock('./getUsersPresence', () => ({
	_activeUsersSubTimeout: { activeUsersSubTimeout: undefined }
}));

import { DDPSDK } from '@rocket.chat/ddp-client';

import { removeServer, logout } from './logout';
import UserPreferences from './userPreferences';
import { getDeviceToken } from '../notifications';
import log from './helpers/log';
import { disconnect } from '../services/connect';
import sdk from '../services/sdk';

describe('removeServer', () => {
	beforeEach(() => {
		(UserPreferences.getString as jest.Mock).mockReset();
		(getDeviceToken as jest.Mock).mockReset();
		(DDPSDK.createAndConnect as jest.Mock).mockReset();
		(log as jest.Mock).mockReset();
	});

	it('short-circuits when no stored userId is found for the server', async () => {
		(UserPreferences.getString as jest.Mock).mockReturnValue(null);
		await removeServer({ server: 'https://example.com' });
		expect(DDPSDK.createAndConnect).not.toHaveBeenCalled();
	});

	it('connects, logs in with the resume token, removes push token, and logs out', async () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) => {
			if (key === 'reactnativemeteor_usertoken-https://example.com') return 'user-id-1';
			if (key === 'reactnativemeteor_usertoken-user-id-1') return 'resume-tok';
			return null;
		});
		(getDeviceToken as jest.Mock).mockReturnValue('push-tok');
		const tempSdk = {
			account: {
				loginWithToken: jest.fn().mockResolvedValue(undefined),
				logout: jest.fn().mockResolvedValue(undefined)
			},
			rest: { delete: jest.fn().mockResolvedValue({ success: true }) },
			connection: { close: jest.fn() }
		};
		(DDPSDK.createAndConnect as jest.Mock).mockResolvedValue(tempSdk);

		await removeServer({ server: 'https://example.com' });

		expect(DDPSDK.createAndConnect).toHaveBeenCalledWith('https://example.com');
		expect(tempSdk.account.loginWithToken).toHaveBeenCalledWith('resume-tok');
		expect(tempSdk.rest.delete).toHaveBeenCalledWith('/v1/push.token', { token: 'push-tok' });
		expect(tempSdk.account.logout).toHaveBeenCalled();
		expect(tempSdk.connection.close).toHaveBeenCalled();
	});

	it('skips push-token removal when no device token exists', async () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) =>
			key === 'reactnativemeteor_usertoken-https://example.com' ? 'user-id-1' : 'resume-tok'
		);
		(getDeviceToken as jest.Mock).mockReturnValue(null);
		const tempSdk = {
			account: { loginWithToken: jest.fn(), logout: jest.fn() },
			rest: { delete: jest.fn() },
			connection: { close: jest.fn() }
		};
		(DDPSDK.createAndConnect as jest.Mock).mockResolvedValue(tempSdk);

		await removeServer({ server: 'https://example.com' });

		expect(tempSdk.rest.delete).not.toHaveBeenCalled();
		expect(tempSdk.account.logout).toHaveBeenCalled();
	});

	it('logs a warning when push-token deletion reports success:false', async () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) =>
			key === 'reactnativemeteor_usertoken-https://example.com' ? 'u' : 'r'
		);
		(getDeviceToken as jest.Mock).mockReturnValue('push-tok');
		const tempSdk = {
			account: { loginWithToken: jest.fn(), logout: jest.fn() },
			rest: { delete: jest.fn().mockResolvedValue({ success: false }) },
			connection: { close: jest.fn() }
		};
		(DDPSDK.createAndConnect as jest.Mock).mockResolvedValue(tempSdk);

		await removeServer({ server: 'https://example.com' });
		expect(log).toHaveBeenCalledWith(expect.any(Error));
	});

	it('still closes the temp connection in finally when the connect step throws', async () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) =>
			key === 'reactnativemeteor_usertoken-https://example.com' ? 'u' : 'r'
		);
		(DDPSDK.createAndConnect as jest.Mock).mockRejectedValue(new Error('conn failed'));
		await removeServer({ server: 'https://example.com' });
		expect(log).toHaveBeenCalledWith(expect.any(Error));
	});

	it('closes the connection in finally even when logout throws', async () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) =>
			key === 'reactnativemeteor_usertoken-https://example.com' ? 'u' : 'r'
		);
		(getDeviceToken as jest.Mock).mockReturnValue('push-tok');
		const close = jest.fn();
		const tempSdk = {
			account: {
				loginWithToken: jest.fn(),
				logout: jest.fn().mockRejectedValue(new Error('logout failed'))
			},
			rest: { delete: jest.fn().mockResolvedValue({ success: true }) },
			connection: { close }
		};
		(DDPSDK.createAndConnect as jest.Mock).mockResolvedValue(tempSdk);

		await removeServer({ server: 'https://example.com' });
		expect(close).toHaveBeenCalled();
	});
});

describe('logout', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset sdk.current to undefined before each test
		(sdk as any).current = undefined;
	});

	afterEach(() => {
		// Restore roomsSubscription to its original state to prevent test isolation issues
		const mockRoomsSubscription = jest.requireMock('./subscriptions/rooms');
		if (!mockRoomsSubscription.roomsSubscription || !mockRoomsSubscription.roomsSubscription.stop) {
			mockRoomsSubscription.roomsSubscription = {
				stop: jest.fn()
			};
		}
	});

	it('stops the rooms subscription, clears the presence timer, logs out of the sdk, and disconnects', async () => {
		// Setup
		(sdk as any).current = {}; // Make sdk.current truthy so disconnect() is called
		const mockRoomsSubscription = jest.requireMock('./subscriptions/rooms');
		const mockConnect = jest.requireMock('../services/connect');
		const mockSdk = jest.requireMock('../services/sdk').default;
		const mockActiveUsersTimeout = jest.requireMock('./getUsersPresence')._activeUsersSubTimeout;

		// Set up a timeout ID to be cleared
		mockActiveUsersTimeout.activeUsersSubTimeout = 123;

		// Execute
		await logout({ server: 'https://example.com' });

		// Assert
		expect(mockRoomsSubscription.roomsSubscription.stop).toHaveBeenCalled();
		expect(mockSdk.logout).toHaveBeenCalled();
		expect(mockConnect.disconnect).toHaveBeenCalled();
		// Verify the timeout was cleared
		expect(mockActiveUsersTimeout.activeUsersSubTimeout).toBe(false);
	});

	it('handles missing roomsSubscription gracefully', async () => {
		// Setup
		(sdk as any).current = {};
		const mockRoomsSubscription = jest.requireMock('./subscriptions/rooms');
		const mockConnect = jest.requireMock('../services/connect');
		const mockSdk = jest.requireMock('../services/sdk').default;

		// Set roomsSubscription to null to test the optional chaining
		mockRoomsSubscription.roomsSubscription = null;

		// Execute
		await logout({ server: 'https://example.com' });

		// Assert - should not throw and disconnect should still be called
		expect(mockSdk.logout).toHaveBeenCalled();
		expect(mockConnect.disconnect).toHaveBeenCalled();
	});

	it('handles missing timeout gracefully', async () => {
		// Setup
		(sdk as any).current = {};
		const mockSdk = jest.requireMock('../services/sdk').default;
		const mockConnect = jest.requireMock('../services/connect');
		const mockActiveUsersTimeout = jest.requireMock('./getUsersPresence')._activeUsersSubTimeout;

		// Set activeUsersSubTimeout to undefined
		mockActiveUsersTimeout.activeUsersSubTimeout = undefined;

		// Execute
		await logout({ server: 'https://example.com' });

		// Assert - should not throw
		expect(mockSdk.logout).toHaveBeenCalled();
		expect(mockConnect.disconnect).toHaveBeenCalled();
	});
});
