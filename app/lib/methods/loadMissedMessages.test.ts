import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { updateLastOpen } from './updateLastOpen';
import { getMessageById } from '../database/services/Message';
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

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' } })),
		dispatch: jest.fn()
	}
}));

jest.mock('./updateMessages', () => jest.fn());
jest.mock('./loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));
jest.mock('./updateLastOpen', () => ({ updateLastOpen: jest.fn() }));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;
const mockedUpdateLastOpen = updateLastOpen as jest.MockedFunction<typeof updateLastOpen>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;

const RID = 'ROOM_ID';
const SPAM_RID = 'SPAM_ROOM_ID';
const COOLDOWN_RID = 'COOLDOWN_ROOM_ID';

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);
		mockedGetMessageById.mockResolvedValue(null);
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
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:45:00.000Z' }]);
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

	describe('cursor normalization', () => {
		const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		const flush = () => new Promise(resolve => setImmediate(resolve));

		const subscription = (lastMessage?: { _id: string } | null) => ({ lastOpen: CURSOR, t: 'c', lastMessage } as never);

		const emptySync = () => {
			mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);
		};

		it('tail-loads when the server lastMessage is absent locally', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue(subscription({ _id: 'newest' }));
			mockedGetMessageById.mockResolvedValue(null);
			emptySync();

			await loadMissedMessages({ rid: RID });

			expect(mockedGetMessageById).toHaveBeenCalledWith('newest');
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
		});

		it('does not tail-load when the server lastMessage is already local', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue(subscription({ _id: 'newest' }));
			mockedGetMessageById.mockResolvedValue({ id: 'newest' } as never);
			emptySync();

			await loadMissedMessages({ rid: RID });

			expect(mockedGetMessageById).toHaveBeenCalledWith('newest');
			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		});

		it('does not look up anything when the payload was not empty', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue(subscription({ _id: 'newest' }));
			mockedSdkGet.mockResolvedValue({
				result: {
					updated: [{ _id: 'a', rid: RID, _updatedAt: '2024-01-01T11:30:00.000Z' }],
					deleted: [],
					cursor: { next: null }
				}
			} as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedGetMessageById).not.toHaveBeenCalled();
			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		});

		it('does not tail-load a room that has no lastMessage at all', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue(subscription(null));
			emptySync();

			await loadMissedMessages({ rid: RID });

			expect(mockedGetMessageById).not.toHaveBeenCalled();
			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		});

		it('does not run the heal check mid-pagination', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			mockedGetSubscriptionByRoomId.mockResolvedValue(subscription({ _id: 'newest' }));
			mockedGetMessageById.mockResolvedValue(null);
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				if (params.next === PAGE_2) {
					return Promise.resolve({ result: { updated: [], deleted: [], cursor: { next: null } } });
				}
				return Promise.resolve({ result: { updated: [], deleted: [], cursor: { next: PAGE_2 } } });
			}) as never);

			await loadMissedMessages({ rid: RID });

			expect(mockedGetMessageById).not.toHaveBeenCalled();

			await flush();

			expect(mockedGetMessageById).toHaveBeenCalledWith('newest');
		});

		it('tail-loads only once within the cooldown when lastMessage never resolves locally', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c', lastMessage: { _id: 'ghost' } } as never);
			mockedGetMessageById.mockResolvedValue(null);
			emptySync();

			await loadMissedMessages({ rid: SPAM_RID });
			await loadMissedMessages({ rid: SPAM_RID });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: SPAM_RID, t: 'c' });
		});

		it('tail-loads again after the cooldown expires', async () => {
			const realNow = Date.now();
			const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(realNow);
			try {
				mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c', lastMessage: { _id: 'ghost' } } as never);
				mockedGetMessageById.mockResolvedValue(null);
				emptySync();

				await loadMissedMessages({ rid: COOLDOWN_RID });

				dateNowSpy.mockReturnValue(realNow + 5 * 60 * 1000 + 1);

				await loadMissedMessages({ rid: COOLDOWN_RID });

				expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(2);
				expect(mockedLoadMessagesForRoom).toHaveBeenLastCalledWith({ rid: COOLDOWN_RID, t: 'c' });
			} finally {
				dateNowSpy.mockRestore();
			}
		});
	});
});
