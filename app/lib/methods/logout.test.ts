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
	roomsSubscription: null
}));

jest.mock('./getUsersPresence', () => ({
	_activeUsersSubTimeout: { activeUsersSubTimeout: false }
}));

import { DDPSDK } from '@rocket.chat/ddp-client';

import { removeServer } from './logout';
import UserPreferences from './userPreferences';
import { getDeviceToken } from '../notifications';
import log from './helpers/log';

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
