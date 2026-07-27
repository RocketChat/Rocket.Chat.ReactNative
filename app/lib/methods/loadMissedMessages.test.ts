import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { writeSyncWatermark } from './writeSyncWatermark';
import { store } from '../store/auxStore';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' } })),
		dispatch: jest.fn()
	}
}));

jest.mock('./updateMessages', () => jest.fn());
jest.mock('./loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));
jest.mock('./writeSyncWatermark', () => ({ writeSyncWatermark: jest.fn() }));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;
const mockedWriteSyncWatermark = writeSyncWatermark as jest.MockedFunction<typeof writeSyncWatermark>;

const RID = 'ROOM_ID';

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.4.0' } });
	});

	it('routes a deleted-only recursion payload to remove, not update', async () => {
		const deletedMessage = { _id: 'deleted-1', rid: RID, _updatedAt: new Date(Date.UTC(2024, 0, 1, 12, 0, 0)) };
		mockedSdkGet.mockResolvedValue({
			result: { updated: [], deleted: [deletedMessage], cursor: { next: null } }
		} as never);

		await loadMissedMessages({ rid: RID, deletedNext: 1704110400000 });

		expect(mockedSdkGet).toHaveBeenCalledTimes(1);
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ roomId: RID, type: 'DELETED' }));
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: [],
				remove: [deletedMessage]
			})
		);
	});

	it('falls back to a full history load when no cursor can be resolved', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'p' });
	});

	it('does not fetch when the room type cannot be resolved', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'thread' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
	});

	it('treats a cursor in the future as absent so a clock-skewed room self-heals', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: new Date(Date.now() + 60 * 60 * 1000), t: 'c' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
	});

	describe('sync watermark', () => {
		const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		const flush = () => new Promise(resolve => setImmediate(resolve));

		const message = (id: string, updatedAt: string) => ({ _id: id, rid: RID, _updatedAt: updatedAt });

		beforeEach(() => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
		});

		it('writes the watermark from the updated payload once the cursor has drained', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedWriteSyncWatermark).toHaveBeenCalledTimes(1);
			expect(mockedWriteSyncWatermark).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});

		it('does not write mid-pagination, only after the final page of a paginated run', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				if (params.next === PAGE_2) {
					return Promise.resolve({
						result: { updated: [message('b', '2024-01-01T11:45:00.000Z')], deleted: [], cursor: { next: null } }
					});
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: PAGE_2 } }
				});
			}) as never);

			await loadMissedMessages({ rid: RID });

			// First page still has a next cursor, so nothing may be persisted yet.
			expect(mockedWriteSyncWatermark).not.toHaveBeenCalled();

			await flush();

			expect(mockedWriteSyncWatermark).toHaveBeenCalledTimes(1);
			expect(mockedWriteSyncWatermark).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:45:00.000Z' }]);
		});

		it('writes nothing derived from deleted rows when the payload is deleted-only', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [], deleted: [message('gone', '2024-01-01T11:30:00.000Z')], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedWriteSyncWatermark).toHaveBeenCalledWith(RID, []);
		});

		it('writes once on the legacy unpaginated server branch', async () => {
			(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.0.0' } });
			mockedSdkGet.mockResolvedValue({
				result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [] }
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedSdkGet).toHaveBeenCalledWith(
				'chat.syncMessages',
				expect.objectContaining({ lastUpdate: CURSOR.toISOString() })
			);
			expect(mockedWriteSyncWatermark).toHaveBeenCalledTimes(1);
			expect(mockedWriteSyncWatermark).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});
	});
});
