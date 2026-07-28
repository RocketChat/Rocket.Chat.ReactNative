import { loadMessagesForRoom } from './loadMessagesForRoom';
import sdk from '../services/sdk';
import { ROOM } from '../../actions/actionsTypes';
import { getMessageById } from '../database/services/Message';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import updateMessages from './updateMessages';
import { store } from '../store/auxStore';
import { updateLastOpen } from './updateLastOpen';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: { Hide_System_Messages: ['uj'] }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('./updateMessages', () => jest.fn());
jest.mock('./updateLastOpen', () => ({ updateLastOpen: jest.fn() }));

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
	} as any);

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

	it('falls back to settings.Hide_System_Messages when sub.sysMes is a boolean (not an array)', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ sysMes: true } as any);

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
					} as any)
			);

		it('writes the Last Open from the first batch on the initial tail load', async () => {
			const firstBatch = buildStampedBatch('first', 11, 50);
			const secondBatch = buildStampedBatch('second', 10, 50);

			mockedSdkGet
				.mockResolvedValueOnce({ success: true, messages: firstBatch } as any)
				.mockResolvedValueOnce({ success: true, messages: secondBatch } as any);

			await loadMessagesForRoom({ rid: 'ROOM_ID', t: 'c' });

			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			// Only the first batch's stamps — the older recursion pages must not contribute.
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(
				'ROOM_ID',
				firstBatch.map(message => ({ _updatedAt: message._updatedAt }))
			);
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
