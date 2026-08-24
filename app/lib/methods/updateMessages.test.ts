import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { makeFakeRecord } from '../database/__tests__/mockedWatermelonDB';

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../encryption', () => ({
	Encryption: {
		decryptMessages: jest.fn((messages: unknown[]) => Promise.resolve(messages))
	}
}));

class FakeCollection {
	records: any[];

	schema = {};

	constructor(records: any[] = []) {
		this.records = records;
	}

	query() {
		return { fetch: () => Promise.resolve(this.records) };
	}

	prepareCreate(fn: (m: any) => void) {
		const m: any = { _preparedState: 'create' };
		fn(m);
		return m;
	}
}

const mockDbBatch = jest.fn().mockResolvedValue(undefined);
let collections: Record<string, FakeCollection>;

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: (table: string) => (globalThis as any).__collections[table],
			write: (work: () => Promise<unknown>) => work(),
			batch: (...args: unknown[]) => mockDbBatch(...args)
		}
	}
}));

describe('updateMessages', () => {
	const rid = 'test-room-id';

	beforeEach(() => {
		jest.clearAllMocks();
		mockDbBatch.mockImplementation((records: any[]) => {
			records.forEach((r: any) => {
				r._preparedState = null;
			});
			return Promise.resolve(undefined);
		});
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({ id: rid });
		collections = {
			messages: new FakeCollection([]),
			threads: new FakeCollection([]),
			thread_messages: new FakeCollection([])
		};
		(globalThis as any).__collections = collections;
	});

	it('keeps the existing resolved link preview when a partial sync payload carries no urls', async () => {
		const _id = 'KXse45i7gGYE8j4Xb';
		const existingUrls = [{ url: 'https://example.com', title: 'Example' }];
		const messageRecord = makeFakeRecord(`messages#${_id}`, { urls: existingUrls, unread: false });
		collections.messages = new FakeCollection([messageRecord]);
		(globalThis as any).__collections = collections;

		// No `urls` field in the incoming payload — normalizeMessage defaults it to [] downstream.
		await updateMessages({ rid, update: [{ _id, rid, msg: 'hi' } as any] });

		expect(messageRecord.urls).toEqual(existingUrls);
	});

	it('keeps the existing resolved link preview on the thread record when a partial sync payload carries no urls', async (): Promise<void> => {
		const _id = 'KXse45i7gGYE8j4Xb';
		const existingUrls = [{ url: 'https://example.com', title: 'Example' }];
		const messageRecord = makeFakeRecord(`messages#${_id}`, { unread: false });
		const threadRecord = makeFakeRecord(`threads#${_id}`, { urls: existingUrls, _updatedAt: 1 });
		collections.messages = new FakeCollection([messageRecord]);
		collections.threads = new FakeCollection([threadRecord]);
		(globalThis as any).__collections = collections;

		await updateMessages({ rid, update: [{ _id, rid, msg: 'hi', tlm: { $date: 2 }, _updatedAt: 2 } as any] });

		expect(threadRecord.urls).toEqual(existingUrls);
	});

	it('keeps the existing resolved link preview on the thread message record when a partial sync payload carries no urls', async (): Promise<void> => {
		const _id = 'KXse45i7gGYE8j4Xb';
		const existingUrls = [{ url: 'https://example.com', title: 'Example' }];
		const messageRecord = makeFakeRecord(`messages#${_id}`, { unread: false });
		const threadMessageRecord = makeFakeRecord(`thread_messages#${_id}`, { urls: existingUrls, _updatedAt: 1 });
		collections.messages = new FakeCollection([messageRecord]);
		collections.thread_messages = new FakeCollection([threadMessageRecord]);
		(globalThis as any).__collections = collections;

		await updateMessages({ rid, update: [{ _id, rid, msg: 'hi', tmid: 'parent-thread-id', _updatedAt: 2 } as any] });

		expect(threadMessageRecord.urls).toEqual(existingUrls);
	});
});
