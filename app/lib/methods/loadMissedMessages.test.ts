import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import updateMessages from './updateMessages';
import { store } from '../store/auxStore';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			server: { version: '7.1.0' }
		}))
	}
}));

jest.mock('./updateMessages', () => jest.fn());

const mockSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetState = store.getState as jest.MockedFunction<typeof store.getState>;

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as any);
		mockedUpdateMessages.mockResolvedValue(0 as any);
		mockedGetState.mockReturnValue({ server: { version: '7.1.0' } } as any);
	});

	it('does not throw when the server omits cursor on a syncMessages response', async () => {
		mockSdkGet.mockResolvedValueOnce({ success: true, result: { updated: [], deleted: [] } } as any); // no cursor field at all

		await expect(loadMissedMessages({ rid: 'room-1', updatedNext: 100 })).resolves.toBeUndefined();
	});
});
