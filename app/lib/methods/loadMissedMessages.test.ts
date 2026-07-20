import { loadMissedMessages } from './loadMissedMessages';
import updateMessages from './updateMessages';

const mockSdkGet = jest.fn();
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockSdkGet(...args)
	}
}));

jest.mock('./updateMessages', () => ({
	__esModule: true,
	default: jest.fn<Promise<number | void>, [unknown]>(() => Promise.resolve(0))
}));

jest.mock('./helpers', () => ({
	compareServerVersion: jest.fn(() => true)
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: () => ({ server: { version: '7.1.0' } })
	}
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve({ lastOpen: new Date(1000) }))
}));

describe('loadMissedMessages', () => {
	const rid = 'test-room-id';
	const lastOpen = new Date(1000);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('awaits all recursive pagination pages before resolving (was fire-and-forget)', async () => {
		const page1 = {
			updated: [{ _id: 'm1', rid, msg: 'hello' }],
			deleted: [],
			cursor: { next: 'cursor2' }
		};
		const page2 = {
			updated: [{ _id: 'm2', rid, msg: 'world' }],
			deleted: [],
			cursor: { next: null }
		};
		mockSdkGet
			.mockResolvedValueOnce({ result: page1 })
			.mockResolvedValueOnce({ result: { deleted: [], cursor: { next: null } } })
			.mockResolvedValueOnce({ result: page2 });

		await loadMissedMessages({ rid, lastOpen });

		expect(updateMessages).toHaveBeenCalledTimes(2);
		expect(updateMessages).toHaveBeenNthCalledWith(1, { rid, update: page1.updated, remove: page1.deleted });
		expect(updateMessages).toHaveBeenNthCalledWith(2, { rid, update: page2.updated, remove: page2.deleted });
	});

	it('rejects when a recursive page fails (was silently swallowed)', async () => {
		const page1 = {
			updated: [{ _id: 'm1', rid, msg: 'hello' }],
			deleted: [],
			cursor: { next: 'cursor2' }
		};
		mockSdkGet
			.mockResolvedValueOnce({ result: page1 })
			.mockResolvedValueOnce({ result: { deleted: [], cursor: { next: null } } })
			.mockRejectedValueOnce(new Error('network error'));

		await expect(loadMissedMessages({ rid, lastOpen })).rejects.toThrow('network error');
		expect(updateMessages).toHaveBeenCalledTimes(1);
	});

	it('does not recurse when there are no more pages', async () => {
		const page1 = {
			updated: [{ _id: 'm1', rid, msg: 'hello' }],
			deleted: [],
			cursor: { next: null }
		};
		mockSdkGet
			.mockResolvedValueOnce({ result: page1 })
			.mockResolvedValueOnce({ result: { deleted: [], cursor: { next: null } } });

		await loadMissedMessages({ rid, lastOpen });

		expect(updateMessages).toHaveBeenCalledTimes(1);
	});
});
