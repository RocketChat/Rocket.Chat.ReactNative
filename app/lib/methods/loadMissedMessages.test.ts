import { loadMissedMessages } from './loadMissedMessages';

const mockUpdateMessages = jest.fn<Promise<number>, [unknown]>(() => Promise.resolve(0));
jest.mock('./updateMessages', () => ({
	__esModule: true,
	default: (args: unknown) => mockUpdateMessages(args)
}));

const mockGetSubscriptionByRoomId = jest.fn<Promise<{ lastOpen: Date }>, [string]>(() =>
	Promise.resolve({ lastOpen: new Date('2024-01-01T00:00:00.000Z') })
);
jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: (rid: string) => mockGetSubscriptionByRoomId(rid)
}));

jest.mock('./helpers', () => ({
	compareServerVersion: jest.fn(() => true)
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: () => ({ server: { version: '7.1.0' } })
	}
}));

const mockSdkGet = jest.fn();
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockSdkGet(...args)
	}
}));

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('loadMissedMessages pagination', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not resolve until every recursive page has been fetched and persisted', async () => {
		let resolvePage2: (value: unknown) => void = () => {};
		const page2Promise = new Promise(resolve => {
			resolvePage2 = resolve;
		});

		mockSdkGet.mockImplementation((_endpoint: string, params: { type: 'UPDATED' | 'DELETED'; next: number }) => {
			if (params.type === 'UPDATED' && params.next !== 999) {
				// page 1 - UPDATED: reports more pages via cursor.next
				return Promise.resolve({ result: { updated: [{ _id: 'm1' }], cursor: { next: 999 } } });
			}
			if (params.type === 'DELETED') {
				// page 1 - DELETED: nothing more to fetch
				return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
			}
			// page 2 - UPDATED (next: 999): deferred, held open by the test
			return page2Promise;
		});

		const promise = loadMissedMessages({ rid: 'room1' });
		await flush();

		// page 1 has landed and been persisted; page 2's fetch is in flight
		expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockUpdateMessages).toHaveBeenCalledWith({ rid: 'room1', update: [{ _id: 'm1' }], remove: [] });

		let settled = false;
		promise.then(() => {
			settled = true;
		});
		await flush();
		expect(settled).toBe(false);

		resolvePage2({ result: { updated: [{ _id: 'm2' }], cursor: { next: null } } });
		await promise;

		expect(settled).toBe(true);
		expect(mockUpdateMessages).toHaveBeenCalledTimes(2);
		expect(mockUpdateMessages).toHaveBeenLastCalledWith({ rid: 'room1', update: [{ _id: 'm2' }], remove: [] });
	});

	it('walks a 3-page cursor chain in order and terminates once cursor.next is null', async () => {
		const responses = [
			{ result: { updated: [{ _id: 'm1' }], cursor: { next: 200 } } }, // page 1 - UPDATED
			{ result: { deleted: [], cursor: { next: null } } }, // page 1 - DELETED
			{ result: { updated: [{ _id: 'm2' }], cursor: { next: 300 } } }, // page 2 - UPDATED
			{ result: { updated: [{ _id: 'm3' }], cursor: { next: null } } } // page 3 - UPDATED
		];
		let callIndex = 0;
		mockSdkGet.mockImplementation(() => Promise.resolve(responses[callIndex++]));

		await loadMissedMessages({ rid: 'room1' });

		expect(mockSdkGet).toHaveBeenCalledTimes(4);
		expect(mockUpdateMessages).toHaveBeenCalledTimes(3);
		expect(mockUpdateMessages).toHaveBeenNthCalledWith(1, { rid: 'room1', update: [{ _id: 'm1' }], remove: [] });
		expect(mockUpdateMessages).toHaveBeenNthCalledWith(2, { rid: 'room1', update: [{ _id: 'm2' }], remove: [] });
		expect(mockUpdateMessages).toHaveBeenNthCalledWith(3, { rid: 'room1', update: [{ _id: 'm3' }], remove: [] });
	});

	it('propagates a rejection from any page to the caller instead of swallowing it', async () => {
		mockSdkGet
			.mockResolvedValueOnce({ result: { updated: [{ _id: 'm1' }], cursor: { next: 200 } } }) // page 1 - UPDATED
			.mockResolvedValueOnce({ result: { deleted: [], cursor: { next: null } } }) // page 1 - DELETED
			.mockRejectedValueOnce(new Error('network drop')); // page 2 - UPDATED

		await expect(loadMissedMessages({ rid: 'room1' })).rejects.toThrow('network drop');
		expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
	});
});
