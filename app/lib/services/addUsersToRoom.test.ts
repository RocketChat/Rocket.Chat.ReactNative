import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';
import { addUsersToRoom } from './restApi';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(true),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setState = (version: string) =>
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
		setState('8.6.0');
	});

	it('uses DDP below 8.6.0 with the same arguments as before', async () => {
		setState('8.5.9');
		await addUsersToRoom('rid1', 'c');
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('addUsersToRoom', { rid: 'rid1', users: ['alice', 'bob'] });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('invites each selected user by username through channels.invite on 8.6.0+', async () => {
		await addUsersToRoom('rid1', 'c');
		expect(sdk.post).toHaveBeenCalledTimes(2);
		expect(sdk.post).toHaveBeenCalledWith('channels.invite', { roomId: 'rid1', username: 'alice' });
		expect(sdk.post).toHaveBeenCalledWith('channels.invite', { roomId: 'rid1', username: 'bob' });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('invites each selected user through groups.invite for private rooms on 8.6.0+', async () => {
		await addUsersToRoom('rid1', 'p');
		expect(sdk.post).toHaveBeenCalledTimes(2);
		expect(sdk.post).toHaveBeenCalledWith('groups.invite', { roomId: 'rid1', username: 'alice' });
		expect(sdk.post).toHaveBeenCalledWith('groups.invite', { roomId: 'rid1', username: 'bob' });
	});

	it('rejects when any invite fails', async () => {
		(sdk.post as jest.Mock).mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('error-user-is-banned'));
		await expect(addUsersToRoom('rid1', 'c')).rejects.toThrow('error-user-is-banned');
	});
});
