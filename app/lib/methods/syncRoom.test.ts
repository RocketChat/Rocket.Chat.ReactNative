import { syncRoom } from './syncRoom';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { loadMissedMessages } from './loadMissedMessages';

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));
jest.mock('./loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));
jest.mock('./loadMissedMessages', () => ({ loadMissedMessages: jest.fn() }));

const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;
const mockedLoadMissedMessages = loadMissedMessages as jest.MockedFunction<typeof loadMissedMessages>;

const RID = 'ROOM_ID';
const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('syncRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedLoadMessagesForRoom.mockResolvedValue(undefined);
		mockedLoadMissedMessages.mockResolvedValue(undefined);
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);
	});

	describe('routing', () => {
		it('catches up from the captured Last Open', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);

			await syncRoom({ rid: RID });

			expect(mockedLoadMissedMessages).toHaveBeenCalledWith({ rid: RID, cursor: CURSOR });
			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		});

		it('loads the room history from the subscription type when there is no Last Open', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'p' } as never);

			await syncRoom({ rid: RID, fallbackRoomType: 'c' });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'p' });
			expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		});

		it('loads the room history from the fallback type when there is no subscription', async () => {
			await syncRoom({ rid: RID, fallbackRoomType: 'd' });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'd' });
		});

		it('loads the room history from the fallback type when the subscription type is not a room type', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'not-a-room-type' } as never);

			await syncRoom({ rid: RID, fallbackRoomType: 'c' });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
		});

		it('does nothing without a subscription and without a fallback type', async () => {
			await expect(syncRoom({ rid: RID })).resolves.toBeUndefined();

			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
			expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		});

		it('does nothing when neither the subscription nor the caller offers a valid room type', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'not-a-room-type' } as never);

			await expect(syncRoom({ rid: RID })).resolves.toBeUndefined();

			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
			expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		});
	});

	describe('identical routing from room initialization and reconnect', () => {
		it('catches up for a room with a Last Open, whichever trigger asked', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);

			await syncRoom({ rid: RID, fallbackRoomType: 'c' });
			await syncRoom({ rid: RID });

			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
			expect(mockedLoadMissedMessages.mock.calls).toEqual([[{ rid: RID, cursor: CURSOR }], [{ rid: RID, cursor: CURSOR }]]);
		});

		it('loads the room history for a cursor-less room, whichever trigger asked', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);

			await syncRoom({ rid: RID, fallbackRoomType: 'c' });
			await syncRoom({ rid: RID });

			expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
			expect(mockedLoadMessagesForRoom.mock.calls).toEqual([[{ rid: RID, t: 'c' }], [{ rid: RID, t: 'c' }]]);
		});
	});

	describe('concurrency', () => {
		it('runs one active run and coalesces overlapping requests into a single trailing rerun', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			const firstRun = deferred<void>();
			const trailingRun = deferred<void>();
			mockedLoadMissedMessages
				.mockReturnValueOnce(firstRun.promise)
				.mockReturnValueOnce(trailingRun.promise)
				.mockResolvedValue(undefined);

			const first = syncRoom({ rid: RID });
			await flush();
			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(1);

			const second = syncRoom({ rid: RID });
			const third = syncRoom({ rid: RID });
			const fourth = syncRoom({ rid: RID });
			await flush();
			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(1);

			firstRun.resolve();
			await flush();
			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);

			trailingRun.resolve();
			await Promise.all([first, second, third, fourth]);

			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);
		});

		it('re-reads the latest subscription for the trailing rerun', async () => {
			const firstRun = deferred<void>();
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);
			mockedLoadMessagesForRoom.mockReturnValueOnce(firstRun.promise).mockResolvedValue(undefined);

			const first = syncRoom({ rid: RID, fallbackRoomType: 'c' });
			await flush();

			const second = syncRoom({ rid: RID });
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);

			firstRun.resolve();
			await Promise.all([first, second]);

			expect(mockedGetSubscriptionByRoomId).toHaveBeenCalledTimes(2);
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
			expect(mockedLoadMissedMessages).toHaveBeenCalledWith({ rid: RID, cursor: CURSOR });
		});

		it('keeps rooms independent', async () => {
			const otherRid = 'OTHER_ROOM_ID';
			const firstRun = deferred<void>();
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			mockedLoadMissedMessages.mockReturnValueOnce(firstRun.promise).mockResolvedValue(undefined);

			const first = syncRoom({ rid: RID });
			const other = syncRoom({ rid: otherRid });
			await flush();

			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);

			firstRun.resolve();
			await Promise.all([first, other]);
		});

		it('settles a coalescing caller on its own rerun, not on the active run', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			const firstRun = deferred<void>();
			const trailingRun = deferred<void>();
			mockedLoadMissedMessages.mockReturnValueOnce(firstRun.promise).mockReturnValueOnce(trailingRun.promise);

			const settled: string[] = [];
			const first = syncRoom({ rid: RID }).then(() => settled.push('first'));
			await flush();
			const second = syncRoom({ rid: RID }).then(() => settled.push('second'));

			firstRun.resolve();
			await first;
			await flush();

			expect(settled).toEqual(['first']);
			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);

			trailingRun.resolve();
			await second;

			expect(settled).toEqual(['first', 'second']);
		});

		it("runs a caller's pending rerun even when the active run failed, without reusing its error", async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			const firstRun = deferred<void>();
			mockedLoadMissedMessages.mockReturnValueOnce(firstRun.promise).mockResolvedValue(undefined);

			const first = syncRoom({ rid: RID });
			await flush();
			const second = syncRoom({ rid: RID });

			firstRun.reject(new Error('network down'));

			await expect(first).rejects.toThrow('network down');
			await expect(second).resolves.toBeUndefined();
			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);
		});

		it('does not rerun after an empty response', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);

			await syncRoom({ rid: RID });

			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(1);
			expect(mockedGetSubscriptionByRoomId).toHaveBeenCalledTimes(1);
		});

		it('does not rerun after a failure', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			mockedLoadMissedMessages.mockRejectedValue(new Error('network down'));

			await expect(syncRoom({ rid: RID })).rejects.toThrow('network down');
			await flush();

			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(1);
		});

		it('accepts a new run once the previous one failed', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
			mockedLoadMissedMessages.mockRejectedValueOnce(new Error('network down')).mockResolvedValue(undefined);

			await expect(syncRoom({ rid: RID })).rejects.toThrow('network down');
			await syncRoom({ rid: RID });

			expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(2);
		});
	});
});
