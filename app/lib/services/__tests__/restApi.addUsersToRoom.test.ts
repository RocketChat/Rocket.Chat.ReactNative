import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { addUsersToRoom } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(true),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setServerVersion = (version: string) =>
	(reduxStore.getState as jest.Mock).mockReturnValue({
		server: { version },
		selectedUsers: {
			users: [
				{ _id: 'sub1', name: 'alice' },
				{ _id: 'user2', name: 'bob' }
			]
		}
	});

describe('addUsersToRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it.each([
		['8.5.9', 'c'],
		['8.5.9', 'p'],
		['8.9.0', 'c']
	] as const)('calls addUsersToRoom over DDP on %s (%s)', async (version, t) => {
		setServerVersion(version);
		await addUsersToRoom('rid1', t);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('addUsersToRoom', { rid: 'rid1', users: ['alice', 'bob'] });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it.each([
		['8.6.0', 'p', 'groups.invite'],
		['8.9.0', 'p', 'groups.invite'],
		['9.0.0', 'c', 'channels.invite'],
		['9.0.0-rc.1', 'c', 'channels.invite'],
		['9.0.0', 'p', 'groups.invite']
	] as const)('invites all selected users in one request on %s (%s)', async (version, t, endpoint) => {
		setServerVersion(version);
		await addUsersToRoom('rid1', t);
		expect(sdk.post).toHaveBeenCalledTimes(1);
		expect(sdk.post).toHaveBeenCalledWith(endpoint, { roomId: 'rid1', usernames: ['alice', 'bob'] });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});
