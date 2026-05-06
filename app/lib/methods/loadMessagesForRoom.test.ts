import { loadMessagesForRoom } from './loadMessagesForRoom';
import sdk from '../services/sdk';
import { ROOM } from '../../actions/actionsTypes';
import { getMessageById } from '../database/services/Message';
import updateMessages from './updateMessages';
import { store } from '../store/auxStore';

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

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedDispatch = store.dispatch as jest.MockedFunction<typeof store.dispatch>;

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
	});

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
});
