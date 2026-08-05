import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { updateLastOpen } from './updateLastOpen';
import { loadMessagesForRoom } from './loadMessagesForRoom';
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
jest.mock('./updateLastOpen', () => ({
	...jest.requireActual('./updateLastOpen'),
	updateLastOpen: jest.fn()
}));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

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

	it('recovers through the room history load when the subscription has no cursor', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'p' });
		// The sync walk cannot build a request without a cursor, so it must not issue one.
		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
	});

	// Guards the short-circuit: reaching the legacy branch without a cursor sends `lastUpdate: undefined`.
	it('short-circuits the legacy branch on a server below 7.1.0 when there is no cursor', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.0.0' } });
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
	});

	it('recovers nothing when the subscription type is not a room type', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'thread' } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedSdkGet).not.toHaveBeenCalled();
	});

	it('passes the staleness guard into the recovery so a superseded cycle writes nothing', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);
		const isStale = () => true;

		await loadMissedMessages({ rid: RID, isStale });

		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c', isStale });
	});

	it('keeps a healthy cursor on the sync walk instead of delegating', async () => {
		const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID });

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ next: CURSOR.getTime() }));
	});

	it('does not throw when the response carries no cursor', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: new Date(Date.UTC(2024, 0, 1)), t: 'c' } as never);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [] } } as never);

		await expect(loadMissedMessages({ rid: RID })).resolves.toBeUndefined();
		expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, []);
	});

	it('stops the sync walk at the batch cap instead of paging unbounded history', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: new Date(Date.UTC(2024, 0, 1)), t: 'c' } as never);
		// Every page hands back another cursor, so only the cap can end the walk.
		mockedSdkGet.mockResolvedValue({
			result: { updated: [], deleted: [], cursor: { next: Date.UTC(2024, 0, 1, 11, 0, 0) } }
		} as never);

		await loadMissedMessages({ rid: RID });
		for (let i = 0; i < 30; i += 1) {
			await new Promise(resolve => setImmediate(resolve));
		}

		// 10 pages, each fetching an UPDATED and a DELETED request — and then it stops.
		expect(mockedSdkGet).toHaveBeenCalledTimes(20);
		expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
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
