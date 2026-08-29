import { canOpenRoom } from './canOpenRoom';
import sdk from '../services/sdk';
import { getRoomByTypeAndName } from '../services/restApi';

const mockFind = jest.fn();
const mockQuery = jest.fn();

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn((collection: string) => {
				if (collection === 'subscriptions') {
					return {
						find: mockFind,
						query: mockQuery
					};
				}
				return null;
			})
		}
	}
}));

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		post: jest.fn()
	}
}));

jest.mock('../services/restApi', () => ({
	getRoomByTypeAndName: jest.fn()
}));

const mockedSdkPost = sdk.post as jest.Mock;
const mockedGetRoomByTypeAndName = getRoomByTypeAndName as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockFind.mockRejectedValue(new Error('not found'));
	mockQuery.mockReturnValue({
		fetch: jest.fn().mockResolvedValue([])
	});
});

describe('canOpenRoom — GROUP deeplink', () => {
	const roomFixture = { _id: 'group-id-1', name: 'test-group', t: 'p' };

	it('returns room when getRoomByTypeAndName succeeds and groups.open succeeds', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);
		mockedSdkPost.mockResolvedValue({ success: true });

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(mockedGetRoomByTypeAndName).toHaveBeenCalledWith('p', 'test-group');
		expect(mockedSdkPost).toHaveBeenCalledWith('groups.open', { roomId: 'group-id-1' });
		expect(result).toEqual({ ...roomFixture, rid: 'group-id-1' });
	});

	it('returns room when the path holds a room id instead of a room name', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);
		mockedSdkPost.mockResolvedValue({ success: true });

		const result = await canOpenRoom({ rid: '', path: 'group/6997e23f362b278aeb3d369b' });

		expect(mockedGetRoomByTypeAndName).toHaveBeenCalledWith('p', '6997e23f362b278aeb3d369b');
		expect(mockedSdkPost).toHaveBeenCalledWith('groups.open', { roomId: 'group-id-1' });
		expect(result).toEqual({ ...roomFixture, rid: 'group-id-1' });
	});

	it('returns room when groups.open reports the group is already open', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);
		mockedSdkPost.mockRejectedValue({ data: { error: 'The private group, test-group, is already open for the sender' } });

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(result).toEqual({ ...roomFixture, rid: 'group-id-1' });
	});

	it('opens the group by rid without resolving the path segment', async () => {
		mockedSdkPost.mockResolvedValue({ success: true });

		const result = await canOpenRoom({ rid: 'group-id-1', path: 'group/test-group' });

		expect(mockedGetRoomByTypeAndName).not.toHaveBeenCalled();
		expect(mockedSdkPost).toHaveBeenCalledWith('groups.open', { roomId: 'group-id-1' });
		expect(result).toEqual({ rid: 'group-id-1' });
	});

	it('returns false when getRoomByTypeAndName returns null', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(null);

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(mockedSdkPost).not.toHaveBeenCalled();
		expect(result).toBe(false);
	});

	it('returns false when getRoomByTypeAndName returns object without _id', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue({});

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(result).toBe(false);
	});

	it('returns false when getRoomByTypeAndName throws', async () => {
		mockedGetRoomByTypeAndName.mockRejectedValue(new Error('not found'));

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(result).toBe(false);
	});

	it('returns false when groups.open throws a non-already-open error', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);
		mockedSdkPost.mockRejectedValue({ data: { error: 'forbidden' } });

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

		expect(result).toBe(false);
	});
});

describe('canOpenRoom — CHANNEL deeplink', () => {
	const roomFixture = { _id: 'channel-id-1', name: 'test-channel', t: 'c' };

	it('returns room when the path holds a room name', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);

		const result = await canOpenRoom({ rid: '', path: 'channel/test-channel' });

		expect(mockedGetRoomByTypeAndName).toHaveBeenCalledWith('c', 'test-channel');
		expect(mockedSdkPost).not.toHaveBeenCalled();
		expect(result).toEqual({ ...roomFixture, rid: 'channel-id-1' });
	});

	it('returns room when the path holds a room id instead of a room name', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);

		const result = await canOpenRoom({ rid: '', path: 'channel/6997e23f362b278aeb3d369b' });

		expect(mockedGetRoomByTypeAndName).toHaveBeenCalledWith('c', '6997e23f362b278aeb3d369b');
		expect(result).toEqual({ ...roomFixture, rid: 'channel-id-1' });
	});

	it('returns the rid without resolving the path segment when rid is provided', async () => {
		const result = await canOpenRoom({ rid: 'channel-id-1', path: 'channel/test-channel' });

		expect(mockedGetRoomByTypeAndName).not.toHaveBeenCalled();
		expect(mockedSdkPost).not.toHaveBeenCalled();
		expect(result).toEqual({ rid: 'channel-id-1' });
	});

	it('returns false when getRoomByTypeAndName throws', async () => {
		mockedGetRoomByTypeAndName.mockRejectedValue(new Error('not found'));

		const result = await canOpenRoom({ rid: '', path: 'channel/test-channel' });

		expect(result).toBe(false);
	});
});

describe('canOpenRoom — local subscription fast-path', () => {
	const localSubFixture = {
		rid: 'local-room-1',
		t: 'c',
		name: 'general',
		fname: 'General Room',
		prid: '',
		uids: ['u1', 'u2'],
		usernames: ['user1', 'user2']
	};

	it('returns room immediately from local DB when rid matches without calling REST API', async () => {
		mockFind.mockResolvedValueOnce(localSubFixture);

		const result = await canOpenRoom({ rid: 'local-room-1', path: '' });

		expect(mockFind).toHaveBeenCalledWith('local-room-1');
		expect(mockedGetRoomByTypeAndName).not.toHaveBeenCalled();
		expect(mockedSdkPost).not.toHaveBeenCalled();
		expect(result).toEqual(localSubFixture);
	});

	it('returns room immediately from local DB when path matches channel name without calling REST API', async () => {
		mockQuery.mockReturnValueOnce({
			fetch: jest.fn().mockResolvedValueOnce([localSubFixture])
		});

		const result = await canOpenRoom({ rid: '', path: 'channel/general' });

		expect(mockedGetRoomByTypeAndName).not.toHaveBeenCalled();
		expect(mockedSdkPost).not.toHaveBeenCalled();
		expect(result).toEqual(localSubFixture);
	});

	it('returns room from local DB when model has asPlain() method', async () => {
		const modelWithAsPlain = {
			...localSubFixture,
			asPlain: () => localSubFixture
		};
		mockFind.mockResolvedValueOnce(modelWithAsPlain);

		const result = await canOpenRoom({ rid: 'local-room-1', path: '' });

		expect(result).toEqual(localSubFixture);
	});
});

describe('canOpenRoom — other paths', () => {
	it('returns false when no path and no rid', async () => {
		const result = await canOpenRoom({ rid: '', path: '' });
		expect(result).toBe(false);
	});

	it('returns false when path does not match any type', async () => {
		const result = await canOpenRoom({ rid: '', path: 'unknown/foo' });
		expect(mockedGetRoomByTypeAndName).not.toHaveBeenCalled();
		expect(result).toBe(false);
	});
});
