/* eslint-disable import/first */
jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

jest.mock('@nozbe/watermelondb', () => ({
	Q: {
		where: jest.fn(),
		gt: jest.fn(),
		lt: jest.fn(),
		gte: jest.fn(),
		lte: jest.fn(),
		or: jest.fn(),
		like: jest.fn(),
		oneOf: jest.fn()
	}
}));

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribe: jest.fn(),
		get: jest.fn()
	}
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(),
		dispatch: jest.fn()
	}
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => ({
				find: jest.fn().mockRejectedValue(new Error('not found')),
				query: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue([]) })),
				create: jest.fn()
			})),
			write: jest.fn((fn: any) => Promise.resolve(fn()))
		}
	}
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('./helpers', () => ({
	compareServerVersion: jest.requireActual('./helpers/compareServerVersion').compareServerVersion,
	normalizeStatusExpiresAt: jest.fn((value: unknown) => value)
}));

jest.mock('./userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn().mockReturnValue(null),
		setBool: jest.fn(),
		removeItem: jest.fn()
	}
}));

jest.mock('../../actions/activeUsers', () => ({
	setActiveUsers: jest.fn((users: any) => ({ type: 'SET_ACTIVE_USERS', users }))
}));

jest.mock('../../actions/login', () => ({
	setUser: jest.fn((user: any) => ({ type: 'SET_USER', user }))
}));

jest.mock('../../actions/app', () => ({
	setNotificationPresenceCap: jest.fn((val: boolean) => ({ type: 'SET_NOTIFICATION_PRESENCE_CAP', val }))
}));

jest.mock('react-native', () => ({
	InteractionManager: {
		runAfterInteractions: jest.fn((fn: () => void) => fn())
	}
}));

import sdk from '../services/sdk';
import { store as reduxStore } from '../store/auxStore';
import {
	subscribeUsersPresence,
	getUsersPresence,
	getUserPresence,
	setPresenceCap,
	_activeUsersSubTimeout
} from './getUsersPresence';
import { setActiveUsers } from '../../actions/activeUsers';
import { setUser } from '../../actions/login';
import { setNotificationPresenceCap } from '../../actions/app';
import userPreferences from './userPreferences';

function setVersion(version: string, extraState: Record<string, any> = {}) {
	(reduxStore.getState as jest.Mock).mockReturnValue({
		server: { version },
		login: { user: { id: 'u1', username: 'testuser' } },
		settings: {},
		...extraState
	});
}

describe('subscribeUsersPresence', () => {
	beforeEach(() => {
		(sdk.subscribe as jest.Mock).mockReset();
		(reduxStore.dispatch as jest.Mock).mockReset();
		// Reset the activeUsersSubTimeout between tests
		if (_activeUsersSubTimeout.activeUsersSubTimeout) {
			clearTimeout(_activeUsersSubTimeout.activeUsersSubTimeout as number);
			_activeUsersSubTimeout.activeUsersSubTimeout = false;
		}
	});

	it('subscribes stream-notify-logged user-status for server >= 1.1.0 and < 4.1.0', () => {
		setVersion('3.0.0');
		subscribeUsersPresence();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-notify-logged', 'user-status');
	});

	it('does NOT subscribe stream-notify-logged user-status for server >= 4.1.0', () => {
		setVersion('4.1.0');
		subscribeUsersPresence();
		const userStatusCall = (sdk.subscribe as jest.Mock).mock.calls.find(
			(call: any[]) => call[0] === 'stream-notify-logged' && call[1] === 'user-status'
		);
		expect(userStatusCall).toBeUndefined();
	});

	it('schedules activeUsers subscription for server < 1.1.0', () => {
		jest.useFakeTimers();
		setVersion('1.0.0');
		subscribeUsersPresence();
		jest.runAllTimers();
		expect(sdk.subscribe).toHaveBeenCalledWith('activeUsers');
		jest.useRealTimers();
	});

	it('always subscribes stream-notify-logged updateAvatar regardless of version', () => {
		setVersion('5.0.0');
		subscribeUsersPresence();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-notify-logged', 'updateAvatar');
	});

	it('always subscribes stream-notify-logged Users:NameChanged regardless of version', () => {
		setVersion('5.0.0');
		subscribeUsersPresence();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-notify-logged', 'Users:NameChanged');
	});
});

describe('getUsersPresence', () => {
	beforeEach(() => {
		(sdk.get as jest.Mock).mockReset();
		(sdk.subscribe as jest.Mock).mockReset();
		(reduxStore.dispatch as jest.Mock).mockReset();
	});

	it('returns early when Presence_broadcast_disabled is true', async () => {
		setVersion('4.1.0', { settings: { Presence_broadcast_disabled: true } });
		await getUsersPresence(['uid1']);
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('calls /v1/users.presence with ids for server >= 3.0.0', async () => {
		setVersion('4.1.0', { settings: {} });
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: [] });
		await getUsersPresence(['uid1', 'uid2']);
		expect(sdk.get).toHaveBeenCalledWith('/v1/users.presence', { ids: 'uid1,uid2' });
	});

	it('returns early when server >= 3.0.0 and usersParams is empty', async () => {
		setVersion('4.1.0', { settings: {} });
		await getUsersPresence([]);
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('calls /v1/users.presence without ids for server 1.1.0 - 2.x', async () => {
		setVersion('1.1.0', { settings: {} });
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: [] });
		await getUsersPresence(['uid1']);
		expect(sdk.get).toHaveBeenCalledWith('/v1/users.presence', {});
	});

	it('subscribes stream-user-presence via subscribe for server >= 4.1.0 on success', async () => {
		setVersion('4.1.0', { settings: {} });
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: [] });
		await getUsersPresence(['uid1']);
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-user-presence', '', { added: ['uid1'] });
	});

	it('spreads the subscribe params instead of nesting them in one array', async () => {
		setVersion('4.1.0', { settings: {} });
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: [] });
		await getUsersPresence(['user-1', 'user-2']);
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-user-presence', '', { added: ['user-1', 'user-2'] });
	});

	it('dispatches setActiveUsers with user presence data', async () => {
		setVersion('4.1.0', { settings: {} });
		const mockUsers = [{ _id: 'uid1', status: 'online', statusText: 'busy' }];
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: mockUsers });
		await getUsersPresence(['uid1']);
		expect(setActiveUsers).toHaveBeenCalledWith({
			uid1: { status: 'online', statusText: 'busy' }
		});
		expect(reduxStore.dispatch).toHaveBeenCalled();
	});

	it('uses offline status for users not in the response', async () => {
		setVersion('4.1.0', { settings: {} });
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: [] });
		await getUsersPresence(['uid-not-found']);
		expect(setActiveUsers).toHaveBeenCalledWith({
			'uid-not-found': { status: 'offline', statusText: '' }
		});
	});

	it('dispatches setUser when the current user is in the response', async () => {
		setVersion('4.1.0', {
			login: { user: { id: 'u1', username: 'testuser' } },
			settings: {}
		});
		(reduxStore.getState as jest.Mock).mockReturnValue({
			server: { version: '4.1.0' },
			login: { user: { id: 'u1', username: 'testuser' } },
			settings: {}
		});
		const mockUsers = [{ _id: 'u1', status: 'away', statusText: 'in a meeting' }];
		(sdk.get as jest.Mock).mockResolvedValue({ success: true, users: mockUsers });
		await getUsersPresence(['u1']);
		expect(setUser).toHaveBeenCalledWith({ status: 'away', statusText: 'in a meeting' });
	});

	it('does not call SDK when server version is < 1.1.0', async () => {
		setVersion('1.0.0', { settings: {} });
		await getUsersPresence(['uid1']);
		expect(sdk.get).not.toHaveBeenCalled();
	});
});

describe('getUserPresence', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		(sdk.get as jest.Mock).mockReset().mockResolvedValue({ success: true, users: [] });
		setVersion('4.1.0', { settings: {} });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('batches uid and calls getUsersPresence after 2 seconds', () => {
		getUserPresence('uid-batch-1');
		getUserPresence('uid-batch-2');
		// Not called yet
		expect(sdk.get).not.toHaveBeenCalled();
		jest.runAllTimers();
		// After timer fires, should have called sdk.get
		expect(sdk.get).toHaveBeenCalled();
	});
});

describe('setPresenceCap', () => {
	beforeEach(() => {
		(userPreferences.getBool as jest.Mock).mockReset();
		(userPreferences.setBool as jest.Mock).mockReset();
		(userPreferences.removeItem as jest.Mock).mockReset();
		(reduxStore.dispatch as jest.Mock).mockReset();
	});

	it('sets the presence cap preference and dispatches when enabled and not previously set to false', async () => {
		(userPreferences.getBool as jest.Mock).mockReturnValue(null);
		await setPresenceCap(true);
		expect(userPreferences.setBool).toHaveBeenCalledWith('NOTIFICATION_PRESENCE_CAP', true);
		expect(setNotificationPresenceCap).toHaveBeenCalledWith(true);
		expect(reduxStore.dispatch).toHaveBeenCalled();
	});

	it('does not re-set the cap when it is already explicitly set to false', async () => {
		(userPreferences.getBool as jest.Mock).mockReturnValue(false);
		await setPresenceCap(true);
		expect(userPreferences.setBool).not.toHaveBeenCalled();
	});

	it('removes the preference and dispatches false when disabled', async () => {
		await setPresenceCap(false);
		expect(userPreferences.removeItem).toHaveBeenCalledWith('NOTIFICATION_PRESENCE_CAP');
		expect(setNotificationPresenceCap).toHaveBeenCalledWith(false);
		expect(reduxStore.dispatch).toHaveBeenCalled();
	});
});
