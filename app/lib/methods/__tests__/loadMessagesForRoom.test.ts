import { loadMessagesForRoom, waitForLiveTailLoad } from '../loadMessagesForRoom';
import sdk from '../../services/sdk';
import { ROOM } from '~/actions/actionsTypes';
import { getMessageById } from '../../database/services/Message';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import updateMessages from '../updateMessages';
import { store } from '../../store/auxStore';
import { updateLastOpen } from '../updateLastOpen';

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: { Hide_System_Messages: ['uj'] }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../updateMessages', () => jest.fn());
jest.mock('../updateLastOpen', () => ({
	...jest.requireActual('../updateLastOpen'),
	updateLastOpen: jest.fn()
}));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedDispatch = store.dispatch as jest.MockedFunction<typeof store.dispatch>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const buildMessage = ({ id, ts, t }: { id: string; ts: string; t?: string }) =>
	({
		_id: id,
		rid: 'ROOM_ID',
		ts,
		...(t ? { t } : {})
	}) as any;

describe('loadMessagesForRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null);
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as any);
	});

	const buildHiddenBatch = (prefix: string, baseSeconds: number) =>
		Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `${prefix}-${index + 1}`,
				ts: new Date(Date.UTC(2024, 0, 1, 0, 0, baseSeconds - index)).toISOString(),
				t: 'uj'
			})
		);

	it('fetches additional history batches until it fills the visible page when hidden system messages consume the first batch', async () => {
		const firstBatch = Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `first-${index + 1}`,
				ts: new Date(Date.UTC(2024, 0, 1, 0, 0, 50 - index)).toISOString(),
				t: index < 49 ? 'uj' : undefined
			})
		);
		const secondBatch = Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `second-${index + 1}`,
				ts: new Date(Date.UTC(2023, 11, 31, 23, 59, 50 - index)).toISOString(),
				t: index === 49 ? 'uj' : undefined
			})
		);

		mockedSdkGet
			.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
			.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

		await loadMessagesForRoom({
			rid: 'ROOM_ID',
			t: 'c'
		});

		expect(mockedSdkGet).toHaveBeenCalledTimes(2);
		expect(mockedSdkGet).toHaveBeenNthCalledWith(
			2,
			'channels.history',
			expect.objectContaining({
				roomId: 'ROOM_ID',
				latest: firstBatch[firstBatch.length - 1].ts
			})
		);

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(2);
		expect(mockedUpdateMessages).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				rid: 'ROOM_ID',
				update: expect.arrayContaining([
					expect.objectContaining({ _id: 'first-50' }),
					expect.objectContaining({ _id: 'load-more-first-50', t: 'load_more' })
				])
			})
		);
		expect(mockedUpdateMessages).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				rid: 'ROOM_ID',
				update: expect.arrayContaining([
					expect.objectContaining({ _id: 'first-50' }),
					expect.objectContaining({ _id: 'second-49' }),
					expect.objectContaining({ _id: 'load-more-second-50', t: 'load_more' })
				])
			})
		);

		expect(mockedDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: ROOM.HISTORY_UI_LOADER_PUSH,
				loaderId: 'load-more-first-50'
			})
		);
		expect(mockedDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: ROOM.HISTORY_UI_LOADER_POP,
				loaderId: 'load-more-first-50'
			})
		);
	});

	it('stops fetching after MAX_BATCHES even when the visible page is still unfilled', async () => {
		// Every batch is fully hidden, so visibleMainMessagesCount never reaches COUNT
		mockedSdkGet.mockResolvedValue({ success: true, messages: buildHiddenBatch('batch', 50) } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		// MAX_BATCHES = 10
		expect(mockedSdkGet).toHaveBeenCalledTimes(10);
	});

	it('does not append a trailing load-more when the last batch was not full', async () => {
		const partialBatch = Array.from({ length: 30 }, (_, index) =>
			buildMessage({
				id: `partial-${index + 1}`,
				ts: new Date(Date.UTC(2024, 0, 1, 0, 0, 30 - index)).toISOString()
			})
		);

		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: partialBatch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		expect(mockedSdkGet).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		const finalUpdate = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string }[] };
		expect(finalUpdate.update).toHaveLength(30);
		expect(finalUpdate.update.find(m => m.t === 'load_more')).toBeUndefined();
		expect(mockedDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: ROOM.HISTORY_UI_LOADER_PUSH }));
	});

	const buildStoredBatch = () =>
		Array.from({ length: 50 }, (_, index) =>
			buildMessage({ id: `stored-${index + 1}`, ts: new Date(Date.UTC(2024, 0, 1, 0, 0, 50 - index)).toISOString() })
		);

	it('keeps the trailing Older Loader when the same history is loaded again', async () => {
		const batch = buildStoredBatch();
		const storedIds = new Set(batch.map(message => message._id));
		mockedGetMessageById.mockImplementation(id => {
			if (id === 'load-more-stored-50') {
				return Promise.resolve({ id, t: 'load_more' } as any);
			}
			return Promise.resolve(storedIds.has(id) ? ({ id } as any) : null);
		});
		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: batch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const { update } = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string }[] };
		expect(update).toContainEqual(expect.objectContaining({ _id: 'load-more-stored-50', t: 'load_more' }));
	});

	it('does not turn a Newer Loader of the oldest Message into an Older Loader', async () => {
		const batch = buildStoredBatch();
		const storedIds = new Set(batch.map(message => message._id));
		mockedGetMessageById.mockImplementation(id => {
			if (id === 'load-more-stored-50') {
				return Promise.resolve({ id, t: 'load_next_chunk' } as any);
			}
			return Promise.resolve(storedIds.has(id) ? ({ id } as any) : null);
		});
		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: batch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const { update } = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string }[] };
		expect(update.find(message => message.t === 'load_more')).toBeUndefined();
	});

	describe('waitForLiveTailLoad', () => {
		const settled = async (promise: Promise<void>) => {
			let isSettled = false;
			promise.then(() => {
				isSettled = true;
			});
			await new Promise(resolve => setImmediate(resolve));
			return isSettled;
		};

		it('waits for the Live Tail load of the Room in progress', async () => {
			let finishFetch: (response: unknown) => void = () => {};
			mockedSdkGet.mockImplementationOnce(
				() =>
					new Promise(resolve => {
						finishFetch = resolve;
					}) as any
			);

			const latestLoad = loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });
			const waiting = waitForLiveTailLoad('ROOM_ID');
			expect(await settled(waiting)).toBe(false);

			finishFetch({ success: true, messages: [] });
			await latestLoad;
			expect(await settled(waiting)).toBe(true);
		});

		it('resolves when the Live Tail load of the Room fails', async () => {
			const networkError = new Error('boom');
			mockedSdkGet.mockRejectedValueOnce(networkError);

			const latestLoad = loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

			await expect(waitForLiveTailLoad('ROOM_ID')).resolves.toBeUndefined();
			await expect(latestLoad).rejects.toBe(networkError);
		});

		it('does not wait for a load of older Messages', async () => {
			mockedSdkGet.mockImplementationOnce(() => new Promise(() => {}) as any);

			loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c', loaderItem: { id: 'tapped-load-more' } as any });

			expect(await settled(waitForLiveTailLoad('ROOM_ID'))).toBe(true);
		});
	});

	it('drops the Older Loader when the batch after a hidden batch comes back empty', async () => {
		const hiddenBatch = buildHiddenBatch('hidden', 50);
		const storedIds = new Set<string>();
		mockedUpdateMessages.mockImplementation(({ update }) => {
			update.forEach(message => storedIds.add(message._id as string));
			return Promise.resolve(0);
		});
		mockedGetMessageById.mockImplementation(id => Promise.resolve(id && storedIds.has(id) ? ({ id } as any) : null));
		mockedSdkGet
			.mockResolvedValueOnce({ success: true, messages: hiddenBatch } as any)
			.mockResolvedValueOnce({ success: true, messages: [] } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const finalUpdate = mockedUpdateMessages.mock.calls[mockedUpdateMessages.mock.calls.length - 1][0] as {
			update: { _id: string; t?: string }[];
		};
		expect(finalUpdate.update.find(message => message.t === 'load_more')).toBeUndefined();
	});

	it('does not append a trailing Older Loader when the history below the batch is already stored', async () => {
		const batch = buildStoredBatch();
		mockedGetMessageById.mockImplementation(id => Promise.resolve(id?.startsWith('stored-') ? ({ id } as any) : null));
		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: batch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const { update } = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string }[] };
		expect(update.find(message => message.t === 'load_more')).toBeUndefined();
	});

	const buildMillisecondBatch = (prefix: string, baseSeconds: number, t?: string) =>
		Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `${prefix}-${index + 1}`,
				ts: new Date(Date.UTC(2024, 0, 1, 0, 0, baseSeconds, 999 - index * 7)).toISOString(),
				t
			})
		);

	it('stamps the trailing Older Loader one millisecond before the oldest Message of the Chunk', async () => {
		const batch = buildMillisecondBatch('visible', 30);
		const oldest = batch[batch.length - 1];

		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: batch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const { update } = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string; ts: string | Date }[] };
		const loaderRow = update.find(m => m.t === 'load_more');
		expect(loaderRow?._id).toBe('load-more-visible-50');
		expect(new Date(loaderRow?.ts as string | Date).getTime()).toBe(new Date(oldest.ts).getTime() - 1);
	});

	it('stamps the intermediate Older Loader one millisecond before the oldest Message of the first batch', async () => {
		const firstBatch = buildMillisecondBatch('first', 30, 'uj');
		const secondBatch = buildMillisecondBatch('second', 10);
		const oldest = firstBatch[firstBatch.length - 1];

		mockedSdkGet
			.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
			.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		const { update } = mockedUpdateMessages.mock.calls[0][0] as { update: { _id: string; t?: string; ts: string | Date }[] };
		const loaderRow = update.find(m => m.t === 'load_more');
		expect(loaderRow?._id).toBe('load-more-first-50');
		expect(new Date(loaderRow?.ts as string | Date).getTime()).toBe(new Date(oldest.ts).getTime() - 1);
	});

	it('pops the ui loader when a recursive batch fetch fails after the loader was pushed', async () => {
		const firstBatch = buildHiddenBatch('first', 50);
		const networkError = new Error('boom');

		mockedSdkGet.mockResolvedValueOnce({ success: true, messages: firstBatch } as any).mockRejectedValueOnce(networkError);

		await expect(loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' })).rejects.toBe(networkError);

		expect(mockedDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: ROOM.HISTORY_UI_LOADER_PUSH,
				loaderId: 'load-more-first-50'
			})
		);
		expect(mockedDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: ROOM.HISTORY_UI_LOADER_POP,
				loaderId: 'load-more-first-50'
			})
		);
	});

	it.each([[true], [['ul']]])('applies settings.Hide_System_Messages when sub.sysMes is %j', async sysMes => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ sysMes } as any);

		const firstBatch = buildHiddenBatch('first', 50);
		const secondBatch = Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `second-${index + 1}`,
				ts: new Date(Date.UTC(2023, 11, 31, 23, 59, 50 - index)).toISOString()
			})
		);

		mockedSdkGet
			.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
			.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

		await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

		// settings.Hide_System_Messages = ['uj'] (from top-level mock) → first batch hidden → must recurse
		expect(mockedSdkGet).toHaveBeenCalledTimes(2);
	});

	it('does not insert an intermediate load-more when a loaderItem is provided', async () => {
		const firstBatch = buildHiddenBatch('first', 50);
		const secondBatch = Array.from({ length: 50 }, (_, index) =>
			buildMessage({
				id: `second-${index + 1}`,
				ts: new Date(Date.UTC(2023, 11, 31, 23, 59, 50 - index)).toISOString()
			})
		);

		mockedSdkGet
			.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
			.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

		await loadMessagesForRoom({
			rid: 'ROOM_ID',
			t: 'c',
			loaderItem: { id: 'tapped-load-more' } as any
		});

		// Only the outer write — the intermediate batch-1 loader insert is skipped
		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: ROOM.HISTORY_UI_LOADER_PUSH }));
		expect(mockedDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: ROOM.HISTORY_UI_LOADER_POP }));
	});

	describe('last open', () => {
		const mockedUpdateLastOpen = updateLastOpen as jest.MockedFunction<typeof updateLastOpen>;

		const buildStampedBatch = (prefix: string, hour: number, length: number) =>
			Array.from(
				{ length },
				(_, index) =>
					({
						_id: `${prefix}-${index + 1}`,
						rid: 'ROOM_ID',
						ts: new Date(Date.UTC(2024, 0, 1, hour, 0, length - index)).toISOString(),
						_updatedAt: new Date(Date.UTC(2024, 0, 1, hour, 0, length - index)).toISOString(),
						t: 'uj'
					}) as any
			);

		it('writes the Last Open from every fetched batch on the initial tail load', async () => {
			const firstBatch = buildStampedBatch('first', 11, 50);
			const secondBatch = buildStampedBatch('second', 10, 50);

			mockedSdkGet
				.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
				.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

			await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			// Every batch's server stamps contribute to the cursor, not just the newest page.
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(
				'ROOM_ID',
				expect.arrayContaining([
					...firstBatch.map(message => ({ _updatedAt: message._updatedAt })),
					...secondBatch.map(message => ({ _updatedAt: message._updatedAt }))
				])
			);
		});

		it('uses the highest _updatedAt even when it arrives in an older batch', async () => {
			const firstBatch = buildStampedBatch('first', 11, 50);
			const secondBatch = buildStampedBatch('second', 10, 50).map(message => ({
				...message,
				_updatedAt: new Date(Date.UTC(2024, 0, 1, 12, 0, 0)).toISOString()
			}));

			mockedSdkGet
				.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
				.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

			await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

			const received = mockedUpdateLastOpen.mock.calls[0][1];
			const timestamps = received.map(m => new Date(m._updatedAt as string | Date).getTime()).filter(t => !Number.isNaN(t));
			expect(new Date(Math.max(...timestamps))).toEqual(new Date(Date.UTC(2024, 0, 1, 12, 0, 0)));
		});

		it('does not write when loading an older page (latest)', async () => {
			mockedSdkGet.mockResolvedValueOnce({ success: true, messages: buildStampedBatch('older', 9, 10) } as any);

			await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c', latest: new Date(Date.UTC(2024, 0, 1, 10, 0, 0)) });

			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		});

		it('does not write when filling a gap (loaderItem)', async () => {
			mockedSdkGet.mockResolvedValueOnce({ success: true, messages: buildStampedBatch('gap', 9, 10) } as any);

			await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c', loaderItem: { id: 'tapped-load-more' } as any });

			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		});
	});
});
