import { canOpenRoom } from './canOpenRoom';
import sdk from '../services/sdk';
import { getRoomByTypeAndName } from '../services/restApi';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		post: jest.fn(),
		get: jest.fn()
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

	it('returns false when getRoomByTypeAndName returns null', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(null);

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

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

	it('returns false when groups.open throws "is already open"', async () => {
		mockedGetRoomByTypeAndName.mockResolvedValue(roomFixture);
		mockedSdkPost.mockRejectedValue({ data: { error: 'is already open' } });

		const result = await canOpenRoom({ rid: '', path: 'group/test-group' });

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
		expect(result).toBe(false);
	});
});
