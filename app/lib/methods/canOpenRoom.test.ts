import { canOpenRoom } from './canOpenRoom';
import sdk from '../services/sdk';
import { getRoomByTypeAndName } from '../services/restApi';

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
