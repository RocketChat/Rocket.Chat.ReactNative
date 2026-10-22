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
		setServerVersion('9.0.0');
	});

	it.each(['c', 'p'] as const)('calls addUsersToRoom over DDP below 9.0.0 (%s)', async t => {
		setServerVersion('8.9.0');
		await addUsersToRoom('rid1', t);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('addUsersToRoom', { rid: 'rid1', users: ['alice', 'bob'] });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it.each([
		['c', 'channels.invite'],
		['p', 'groups.invite']
	] as const)('invites all selected users in one request on 9.0.0+ (%s)', async (t, endpoint) => {
		await addUsersToRoom('rid1', t);
		expect(sdk.post).toHaveBeenCalledTimes(1);
		expect(sdk.post).toHaveBeenCalledWith(endpoint, { roomId: 'rid1', usernames: ['alice', 'bob'] });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('rejects when the invite fails', async () => {
		(sdk.post as jest.Mock).mockRejectedValueOnce(new Error('error-user-is-banned'));
		await expect(addUsersToRoom('rid1', 'c')).rejects.toThrow('error-user-is-banned');
	});
});
