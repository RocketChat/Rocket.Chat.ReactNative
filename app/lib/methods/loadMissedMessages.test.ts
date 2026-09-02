import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { updateLastOpen } from './updateLastOpen';
import { store } from '../store/auxStore';
import { loadMessagesForRoom } from './loadMessagesForRoom';

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
jest.mock('./updateLastOpen', () => ({
	...jest.requireActual('./updateLastOpen'),
	updateLastOpen: jest.fn()
}));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedUpdateLastOpen = updateLastOpen as jest.MockedFunction<typeof updateLastOpen>;
const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;

const RID = 'ROOM_ID';

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		mockedLoadMessagesForRoom.mockResolvedValue(undefined as never);
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.4.0' } });
	});

	it('routes a deleted-only recursion payload to remove, not update', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);
		const deletedMessage = { _id: 'deleted-1', rid: RID, _updatedAt: new Date(Date.UTC(2024, 0, 1, 12, 0, 0)) };
		mockedSdkGet.mockResolvedValue({
			result: { updated: [], deleted: [deletedMessage], cursor: { next: null } }
		} as never);

		await loadMissedMessages({ rid: RID, deletedNext: 1704110400000 });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
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

	it('loads the room history instead of syncing when the subscription has no cursor', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'p' });
		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});

	it('falls through to the sync path when the subscription type is not a room type', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'not-a-room-type' } as never);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: RID, update: [], remove: [] }));
	});

	it('does nothing when there is no subscription', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);

		await expect(loadMissedMessages({ rid: RID })).resolves.toBeUndefined();

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
		expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
	});

	it('syncs from the cursor when the subscription has one', async () => {
		const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedSdkGet).toHaveBeenCalledTimes(2);
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', {
			roomId: RID,
			next: CURSOR.getTime(),
			count: 50,
			type: 'UPDATED'
		});
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', {
			roomId: RID,
			next: CURSOR.getTime(),
			count: 50,
			type: 'DELETED'
		});
	});

	it('never delegates on an updated continuation page, even without a cursor', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);
		const UPDATED_NEXT = Date.UTC(2024, 0, 1, 11, 30, 0);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID, updatedNext: UPDATED_NEXT });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedSdkGet).toHaveBeenCalledTimes(1);
		expect(mockedSdkGet).toHaveBeenCalledWith(
			'chat.syncMessages',
			expect.objectContaining({ next: UPDATED_NEXT, type: 'UPDATED' })
		);
	});

	describe('last open', () => {
		const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		const flush = () => new Promise(resolve => setImmediate(resolve));

		const message = (id: string, updatedAt: string) => ({ _id: id, rid: RID, _updatedAt: updatedAt });

		beforeEach(() => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
		});

		it('writes the Last Open from the updated payload once the cursor has drained', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
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
			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();

			await flush();

			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			// Every page walked contributes its stamps, not only the last one.
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [
				{ _updatedAt: '2024-01-01T11:30:00.000Z' },
				{ _updatedAt: '2024-01-01T11:45:00.000Z' }
			]);
		});

		it('keeps the highest _updatedAt when it arrives on an earlier page', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				if (params.next === PAGE_2) {
					return Promise.resolve({
						result: { updated: [message('b', '2024-01-01T11:10:00.000Z')], deleted: [], cursor: { next: null } }
					});
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:59:00.000Z')], deleted: [], cursor: { next: PAGE_2 } }
				});
			}) as never);

			await loadMissedMessages({ rid: RID });
			await flush();

			const received = mockedUpdateLastOpen.mock.calls[0][1];
			const timestamps = received.map(m => new Date(m._updatedAt as string | Date).getTime()).filter(t => !Number.isNaN(t));
			expect(new Date(Math.max(...timestamps))).toEqual(new Date('2024-01-01T11:59:00.000Z'));
		});

		it('does not write again on a deleted-only continuation page', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [], deleted: [message('gone', '2024-01-01T11:30:00.000Z')], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID, deletedNext: Date.UTC(2024, 0, 1, 11, 30, 0) });

			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		});

		it('writes nothing derived from deleted rows when the payload is deleted-only', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [], deleted: [message('gone', '2024-01-01T11:30:00.000Z')], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, []);
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
			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});
	});
});
