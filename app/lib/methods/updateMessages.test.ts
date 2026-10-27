import updateMessages from './updateMessages';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { makeFakeRecord } from '../database/__tests__/mockedWatermelonDB';
import { Encryption } from '../encryption';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../encryption', () => ({
	Encryption: {
		decryptMessages: jest.fn((messages: unknown[]) => Promise.resolve(messages))
	}
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: (raw: unknown) => raw
}));

jest.mock('./helpers/buildMessage', () => ({
	__esModule: true,
	default: (message: unknown) => message
}));

jest.mock('./helpers/protectedFunction', () => ({
	__esModule: true,
	default:
		(fn: (...args: unknown[]) => unknown) =>
		(...args: unknown[]) =>
			fn(...args)
}));

class FakeCollection {
	records: any[];

	created: any[] = [];

	schema = {};

	constructor(records: any[] = []) {
		this.records = records;
	}

	query() {
		return { fetch: () => Promise.resolve(this.records) };
	}

	prepareCreate(fn: (m: any) => void) {
		const m: any = { _preparedState: 'create', subscription: {} };
		fn(m);
		this.created.push(m);
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
			records.filter(Boolean).forEach((r: any) => {
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

	const setRecords = (table: string, records: any[]): FakeCollection => {
		collections[table] = new FakeCollection(records);
		(globalThis as any).__collections = collections;
		return collections[table];
	};

	const batched = (): any[] => mockDbBatch.mock.calls[0]?.[0] ?? [];

	describe('guard and subscription', () => {
		it('returns 0 and touches nothing when there is nothing to update or remove', async () => {
			await expect(updateMessages({ rid, update: [], remove: [] })).resolves.toBe(0);

			expect(getSubscriptionByRoomId).not.toHaveBeenCalled();
			expect(mockDbBatch).not.toHaveBeenCalled();
		});

		it('falls back to the room id and warns when the room has no subscription', async () => {
			(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(null);
			const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any] });

			expect(consoleLog).toHaveBeenCalledWith('updateMessages: subscription not found');
			expect(collections.messages.created[0].subscription.id).toBe(rid);
			consoleLog.mockRestore();
		});

		it('decrypts the incoming payload before diffing it', async () => {
			const raw = { _id: 'm1', rid, msg: 'hi' } as any;

			await updateMessages({ rid, update: [raw] });

			expect(Encryption.decryptMessages).toHaveBeenCalledWith([raw]);
		});
	});

	describe('messages', () => {
		it('creates messages that are not stored yet, under the subscription', async () => {
			setRecords('messages', []);

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any] });

			const { created } = collections.messages;
			expect(created).toHaveLength(1);
			expect(created[0]._raw).toEqual({ id: 'm1' });
			expect(created[0].msg).toBe('hi');
			expect(created[0].subscription.id).toBe(rid);
			expect(batched()).toContain(created[0]);
		});

		it('updates messages that are already stored', async () => {
			const record = makeFakeRecord('messages#m1', { msg: 'old', unread: false });
			setRecords('messages', [record]);

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'new' } as any] });

			expect(record.msg).toBe('new');
			expect(collections.messages.created).toHaveLength(0);
			expect(batched()).toContain(record);
		});

		it('nulls the blocks when the incoming message has none', async () => {
			const record = makeFakeRecord('messages#m1', { blocks: [{ type: 'section' }], unread: false });
			setRecords('messages', [record]);

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any] });

			expect(record.blocks).toBeNull();
		});

		it('clears the markdown when the incoming message has none', async () => {
			const record = makeFakeRecord('messages#m1', { md: [{ type: 'PARAGRAPH' }], unread: false });
			setRecords('messages', [record]);

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any] });

			expect(record.md).toBeUndefined();
		});

		it('keeps an already read message read even when the payload says unread', async () => {
			const record = makeFakeRecord('messages#m1', { unread: false });
			setRecords('messages', [record]);
			const incoming = { _id: 'm1', rid, msg: 'hi', unread: true } as any;

			await updateMessages({ rid, update: [incoming] });

			expect(record.unread).toBe(false);
			expect(incoming.unread).toBe(false);
		});

		it('keeps the stored attachments only while image_url is unchanged', async () => {
			const stored = [{ image_url: '/file/a.png', title_link: 'file://downloaded.png' }];
			const record = makeFakeRecord('messages#m1', { attachments: stored, unread: false });
			setRecords('messages', [record]);

			await updateMessages({
				rid,
				update: [{ _id: 'm1', rid, msg: 'hi', attachments: [{ image_url: '/file/a.png' }] } as any]
			});

			expect(record.attachments).toBe(stored);

			const replacing = [{ image_url: '/file/b.png' }];
			const other = makeFakeRecord('messages#m2', { attachments: stored, unread: false });
			setRecords('messages', [other]);
			mockDbBatch.mockClear();

			await updateMessages({ rid, update: [{ _id: 'm2', rid, msg: 'hi', attachments: replacing } as any] });

			expect(other.attachments).toBe(replacing);
		});

		it('yields a null placeholder and leaves the record alone when prepareUpdate throws', async () => {
			const record = makeFakeRecord('messages#m1', { msg: 'old', unread: false });
			record.prepareUpdate = jest.fn(() => {
				throw new Error('Cannot update a record with pending changes (messages#m1)');
			});
			setRecords('messages', [record]);

			await expect(updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'new' } as any] })).resolves.toBe(1);

			expect(record.msg).toBe('old');
			expect(batched()).not.toContain(record);
			expect(batched()).toContain(null);
		});
	});

	describe('deletes', () => {
		it('destroys the messages, threads and thread messages listed in remove', async () => {
			const message = makeFakeRecord('messages#m1', { msg: 'bye' });
			const thread = makeFakeRecord('threads#m1', {});
			const threadMessage = makeFakeRecord('thread_messages#m1', {});
			setRecords('messages', [message]);
			setRecords('threads', [thread]);
			setRecords('thread_messages', [threadMessage]);
			const destroys = [message, thread, threadMessage].map(record => jest.spyOn(record as any, 'prepareDestroyPermanently'));

			await updateMessages({ rid, update: [], remove: [{ _id: 'm1' }] });

			destroys.forEach(destroy => expect(destroy).toHaveBeenCalled());
			expect(batched()).toEqual(expect.arrayContaining([message, thread, threadMessage]));
		});

		it('destroys the load-more record the incoming message replaces', async () => {
			const loader = makeFakeRecord(`messages#${generateLoadMoreId('m1')}`, { t: 'load_more' });
			setRecords('messages', [loader]);
			const destroy = jest.spyOn(loader as any, 'prepareDestroyPermanently');

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any] });

			expect(destroy).toHaveBeenCalled();
			expect(batched()).toContain(loader);
		});

		it('destroys the loaderItem it was handed', async () => {
			const loaderItem = makeFakeRecord('messages#loaderItem', { t: 'load_more' });
			const destroy = jest.spyOn(loaderItem as any, 'prepareDestroyPermanently');

			await updateMessages({ rid, update: [{ _id: 'm1', rid, msg: 'hi' } as any], loaderItem: loaderItem as any });

			expect(destroy).toHaveBeenCalled();
			expect(batched()).toContain(loaderItem);
		});
	});

	describe('threads', () => {
		it('creates a thread for an incoming message carrying tlm', async () => {
			setRecords('threads', []);

			await updateMessages({ rid, update: [{ _id: 't1', rid, msg: 'hi', tlm: { $date: 1 } } as any] });

			const { created } = collections.threads;
			expect(created).toHaveLength(1);
			expect(created[0]._raw).toEqual({ id: 't1' });
			expect(created[0].subscription.id).toBe(rid);
			expect(batched()).toContain(created[0]);
		});

		it('updates a stored thread when the incoming one is newer', async () => {
			const thread = makeFakeRecord('threads#t1', { msg: 'old', _updatedAt: 1 });
			setRecords('threads', [thread]);

			await updateMessages({ rid, update: [{ _id: 't1', rid, msg: 'new', tlm: { $date: 1 }, _updatedAt: 2 } as any] });

			expect(thread.msg).toBe('new');
			expect(batched()).toContain(thread);
			expect(collections.threads.created).toHaveLength(0);
		});

		it('leaves a stored thread alone when the incoming one is not newer', async () => {
			const thread = makeFakeRecord('threads#t1', { msg: 'old', _updatedAt: 5 });
			setRecords('threads', [thread]);

			await updateMessages({ rid, update: [{ _id: 't1', rid, msg: 'new', tlm: { $date: 1 }, _updatedAt: 2 } as any] });

			expect(thread.msg).toBe('old');
			expect(batched()).not.toContain(thread);
		});
	});

	describe('thread messages', () => {
		it('creates a thread message rooted at its tmid', async () => {
			setRecords('thread_messages', []);
			const incoming = { _id: 'tm1', rid, msg: 'hi', tmid: 'parent' } as any;

			await updateMessages({ rid, update: [incoming] });

			const { created } = collections.thread_messages;
			expect(created).toHaveLength(1);
			expect(created[0]._raw).toEqual({ id: 'tm1' });
			expect(created[0].rid).toBe('parent');
			expect(created[0].subscription.id).toBe(rid);
			expect(incoming.tmid).toBeUndefined();
			expect(batched()).toContain(created[0]);
		});

		it('updates a stored thread message when the incoming one is newer, nulling absent blocks', async () => {
			const threadMessage = makeFakeRecord('thread_messages#tm1', {
				msg: 'old',
				blocks: [{ type: 'section' }],
				_updatedAt: 1
			});
			setRecords('thread_messages', [threadMessage]);

			await updateMessages({ rid, update: [{ _id: 'tm1', rid, msg: 'new', tmid: 'parent', _updatedAt: 2 } as any] });

			expect(threadMessage.msg).toBe('new');
			expect(threadMessage.blocks).toBeNull();
			expect(threadMessage.rid).toBe('parent');
			expect(threadMessage.tmid).toBeUndefined();
			expect(batched()).toContain(threadMessage);
		});
	});

	describe('batch', () => {
		it('batches every prepared record once and returns how many there were', async () => {
			setRecords('messages', []);
			setRecords('threads', []);
			setRecords('thread_messages', []);

			const result = await updateMessages({
				rid,
				update: [{ _id: 'm1', rid, msg: 'hi', tlm: { $date: 1 }, tmid: 'parent', _updatedAt: 2 } as any]
			});

			expect(mockDbBatch).toHaveBeenCalledTimes(1);
			expect(batched()).toHaveLength(3);
			expect(result).toBe(3);
		});
	});
});
