import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import updateMessages from './updateMessages';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { store } from '../store/auxStore';
import database from '../database';
import { SubscriptionType } from '../../definitions';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null))
}));

jest.mock('./updateMessages', () => jest.fn(() => Promise.resolve(0)));

jest.mock('./loadMessagesForRoom', () => ({
	__esModule: true,
	loadMessagesForRoom: jest.fn(() => Promise.resolve())
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.1.0' } }))
	}
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(),
			write: jest.fn()
		}
	}
}));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;
const mockedGetState = store.getState as jest.MockedFunction<typeof store.getState>;
const mockGet = database.active.get as jest.Mock;
const mockWrite = database.active.write as jest.Mock;

const RID = 'ROOM_ID';

const buildSubscription = (overrides: { lastOpen?: Date; t?: SubscriptionType } = {}) => ({
	id: RID,
	lastOpen: overrides.lastOpen ?? new Date('2024-01-01T00:00:00.000Z'),
	t: overrides.t ?? SubscriptionType.CHANNEL,
	update: jest.fn((fn: (s: any) => void) => {
		const model: any = { lastOpen: subscription.lastOpen };
		fn(model);
		subscription.lastOpen = model.lastOpen;
		return Promise.resolve();
	})
});

let subscription: ReturnType<typeof buildSubscription>;

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedSdkGet.mockReset();
		mockedGetState.mockReset().mockReturnValue({ server: { version: '7.1.0' } } as any);
		subscription = buildSubscription();
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as any);
		mockGet.mockReturnValue({ find: jest.fn(() => Promise.resolve(subscription)) });
		mockWrite.mockImplementation((cb: () => Promise<void>) => cb());
	});

	const buildMessage = (_id: string, _updatedAt: string | Date | number) => ({ _id, rid: RID, _updatedAt });

	const buildUpdatedPage = (messages: any[], next: number | null = null): any => ({
		result: { updated: messages, cursor: { next } }
	});

	const buildDeletedPage = (messages: any[], next: number | null = null): any => ({
		result: { deleted: messages, cursor: { next } }
	});

	describe('null cursor delegation', () => {
		it('delegates to loadMessagesForRoom exactly once when lastOpen is missing', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ ...subscription, lastOpen: undefined } as any);

			await loadMissedMessages({ rid: RID });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
			expect(mockedSdkGet).not.toHaveBeenCalled();
		});

		it('delegates to loadMessagesForRoom exactly once when lastOpen is epoch zero', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ ...subscription, lastOpen: new Date(0) } as any);

			await loadMissedMessages({ rid: RID });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c' });
		});

		it('rethrows when the delegated load fails', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ ...subscription, lastOpen: undefined } as any);
			const error = new Error('tail load failed');
			mockedLoadMessagesForRoom.mockRejectedValueOnce(error);

			await expect(loadMissedMessages({ rid: RID })).rejects.toBe(error);
			expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
		});

		it('uses the caller-provided t as fallback when there is no subscription row', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue(null);

			await loadMissedMessages({ rid: RID, t: 'd' });

			expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'd' });
		});

		it('does not fetch when room type cannot be resolved', async () => {
			mockedGetSubscriptionByRoomId.mockResolvedValue({ ...subscription, t: SubscriptionType.THREAD } as any);

			await loadMissedMessages({ rid: RID });

			expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
			expect(mockedSdkGet).not.toHaveBeenCalled();
		});
	});

	describe('7.1.0+ sync cursor', () => {
		it('writes the cursor once when the UPDATED stream drains', async () => {
			const firstPageMax = new Date('2024-02-01T00:00:00.000Z').getTime();
			const secondPageMax = new Date('2024-03-01T00:00:00.000Z').getTime();

			mockedSdkGet
				.mockResolvedValueOnce(buildUpdatedPage([buildMessage('m1', firstPageMax)], 1000))
				.mockResolvedValueOnce(buildDeletedPage([], null))
				.mockResolvedValueOnce(buildUpdatedPage([buildMessage('m2', secondPageMax)], null))
				.mockResolvedValueOnce(buildDeletedPage([], null));

			await loadMissedMessages({ rid: RID });

			expect(mockedUpdateMessages).toHaveBeenCalledTimes(2);
			expect(subscription.lastOpen?.getTime()).toBe(secondPageMax);
		});

		it('never writes the cursor from DELETED pages', async () => {
			const initialLastOpen = subscription.lastOpen;
			mockedSdkGet
				.mockResolvedValueOnce(buildUpdatedPage([], null))
				.mockResolvedValueOnce(buildDeletedPage([{ _id: 'd1', _deletedAt: new Date().toISOString() }], null));

			await loadMissedMessages({ rid: RID });

			expect(subscription.lastOpen).toEqual(initialLastOpen);
		});

		it('drains both streams fully before returning', async () => {
			mockedSdkGet
				.mockResolvedValueOnce(buildUpdatedPage([buildMessage('u1', '2024-01-01T00:00:00.000Z')], 1000))
				.mockResolvedValueOnce(buildDeletedPage([], 2000))
				.mockResolvedValueOnce(buildUpdatedPage([buildMessage('u2', '2024-02-01T00:00:00.000Z')], null))
				.mockResolvedValueOnce(buildDeletedPage([], null));

			await loadMissedMessages({ rid: RID });

			expect(mockedSdkGet).toHaveBeenCalledTimes(4);
			expect(mockedUpdateMessages).toHaveBeenCalledTimes(2);
			expect(subscription.lastOpen?.getTime()).toBe(new Date('2024-02-01T00:00:00.000Z').getTime());
		});
	});

	describe('legacy branch', () => {
		beforeEach(() => {
			mockedGetState.mockReturnValue({ server: { version: '6.0.0' } } as any);
		});

		it('writes the cursor from a single unpaginated response', async () => {
			const max = new Date('2024-05-01T00:00:00.000Z').getTime();
			mockedSdkGet.mockResolvedValueOnce({
				result: {
					updated: [buildMessage('m1', max)],
					deleted: []
				}
			} as any);

			await loadMissedMessages({ rid: RID });

			expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
			expect(subscription.lastOpen?.getTime()).toBe(max);
		});
	});
});
