import database from '../database';
import log from './helpers/log';
import { messagesStatus } from '../constants/messagesStatus';
import { sendMessage } from './sendMessage';

type FakeRecord = Record<string, any>;

interface FakeCollection {
	schema: Record<string, unknown>;
	records: Map<string, FakeRecord>;
	find: (id: string) => Promise<FakeRecord>;
	prepareCreate: (updater: (m: FakeRecord) => void) => FakeRecord;
}

// Mirrors WatermelonDB's invariant: prepareUpdate on a record that already has a prepared change
// throws `Cannot update a record with pending changes` (Model/index.js).
const makeRecord = (debugName: string, fields: FakeRecord = {}): FakeRecord => {
	const record: FakeRecord = {
		...fields,
		__debugName: debugName,
		_preparedState: null,
		prepareUpdate(updater: (m: FakeRecord) => void) {
			if (record._preparedState) {
				throw new Error(`Cannot update a record with pending changes (${debugName})`);
			}
			updater(record);
			record._preparedState = 'update';
			return record;
		}
	};
	return record;
};

const makeCollection = (name: string): FakeCollection => {
	const collection: FakeCollection = {
		schema: {},
		records: new Map(),
		find: (id: string) => {
			const existing = collection.records.get(id);
			if (!existing) {
				return Promise.reject(new Error(`Record ${name}#${id} not found`));
			}
			return Promise.resolve(existing);
		},
		prepareCreate: (updater: (m: FakeRecord) => void) => {
			const record = makeRecord(`${name}#created`);
			updater(record);
			record._preparedState = 'create';
			// sanitizedRaw is mocked to identity below, so `_raw.id` is the client-generated id.
			const id = record._raw?.id;
			if (id) {
				collection.records.set(id, record);
			}
			return record;
		}
	};
	return collection;
};

let collections: Record<string, FakeCollection> = {};
const mockGetCollection = (name: string): FakeCollection => {
	if (!collections[name]) {
		collections[name] = makeCollection(name);
	}
	return collections[name];
};

// db.batch commits prepared records, clearing their pending state (like the real writer).
const mockDbBatch = jest.fn((...args: any[]) => {
	args.flat().forEach((item: FakeRecord) => {
		if (item && typeof item === 'object' && '_preparedState' in item) {
			item._preparedState = null;
		}
	});
	return Promise.resolve(undefined);
});

jest.mock('../database', () => {
	let writerQueue: Promise<unknown> = Promise.resolve();
	return {
		__esModule: true,
		default: {
			active: {
				get: (name: string) => mockGetCollection(name),
				// Serialized writer lock, like WatermelonDB's.
				write: (callback: () => Promise<void>) => {
					const run = writerQueue.then(() => callback());
					writerQueue = run.catch(() => undefined);
					return run;
				},
				batch: (...args: unknown[]) => mockDbBatch(...args)
			}
		}
	};
});

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: (raw: unknown) => raw
}));

const mockEncryptionGate: { promise: Promise<void> | null } = { promise: null };
jest.mock('../encryption', () => ({
	Encryption: {
		encryptMessage: jest.fn(async (message: unknown) => {
			if (mockEncryptionGate.promise) {
				await mockEncryptionGate.promise;
			}
			return message;
		})
	}
}));

const mockPost = jest.fn<Promise<any>, unknown[]>(() => Promise.resolve({ success: true, message: {} }));
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		post: (...args: unknown[]) => mockPost(...args)
	}
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const db = (database as any).active;

const deferred = () => {
	let resolve: () => void = () => undefined;
	const promise = new Promise<void>(r => {
		resolve = r;
	});
	return { promise, resolve };
};

// Let every already-queued microtask/promise chain settle.
const flush = () => new Promise(resolve => setImmediate(resolve));

const loggedPendingChanges = () => (log as jest.Mock).mock.calls.some(([error]) => /pending changes/.test(error?.message ?? ''));

describe('sendMessage', () => {
	const rid = 'GENERAL';
	const user = { id: 'userId', username: 'rocket.cat', name: 'Rocket Cat' };

	beforeEach(() => {
		jest.clearAllMocks();
		collections = {};
		mockEncryptionGate.promise = null;
		mockPost.mockImplementation(() => Promise.resolve({ success: true, message: {} }));
	});

	describe('sendMessage', () => {
		it('does not throw "pending changes" when a concurrent writer touches the subscription mid-send', async () => {
			const subscriptions = mockGetCollection('subscriptions');
			const room = makeRecord(`subscriptions#${rid}`, { draftMessage: 'a draft' });
			subscriptions.records.set(rid, room);

			// Hold the writer lock while sendMessage is still encrypting, then update the very record
			// sendMessage is about to prepare (the subscription whose draft gets cleared).
			const concurrentGate = deferred();
			const concurrentWrite = db.write(async () => {
				await concurrentGate.promise;
				const record = await subscriptions.find(rid);
				await db.batch([
					record.prepareUpdate((r: FakeRecord) => {
						r.draftMessage = 'edited by another writer';
					})
				]);
			});

			const encryption = deferred();
			mockEncryptionGate.promise = encryption.promise;

			const send = sendMessage(rid, 'hello', undefined, user);

			// Release encryption first so an unlocked implementation prepares its records now — before
			// the concurrent writer runs — and holds them pending until its own batch.
			encryption.resolve();
			await flush();
			concurrentGate.resolve();

			await expect(Promise.all([concurrentWrite, send])).resolves.toBeDefined();

			expect(loggedPendingChanges()).toBe(false);
			const created = mockDbBatch.mock.calls
				.flat(2)
				.find((item: FakeRecord) => item?.status === messagesStatus.TEMP || item?.status === messagesStatus.SENT);
			expect(created).toBeDefined();
			expect(created.msg).toBe('hello');
			expect(room.draftMessage).toBeFalsy();
			// Nothing was left prepared-but-uncommitted.
			expect(created._preparedState).toBeNull();
			expect(room._preparedState).toBeNull();
		});
	});

	describe('changeMessageStatus', () => {
		it('does not throw "pending changes" when a concurrent writer touches the message mid-status-update', async () => {
			const tmid = 'threadHeaderId';
			const messages = mockGetCollection('messages');
			messages.records.set(
				tmid,
				makeRecord(`messages#${tmid}`, {
					msg: 'thread header',
					ts: new Date(0),
					tcount: 1,
					u: { _id: 'other' },
					attachments: []
				})
			);
			mockGetCollection('threads');
			mockGetCollection('thread_messages');
			mockGetCollection('subscriptions');

			// Block the server response so we can set up the race before changeMessageStatus runs.
			const post = deferred();
			mockPost.mockImplementation(async () => {
				await post.promise;
				return { success: true, message: { mentions: [], channels: [] } };
			});

			const send = sendMessage(rid, 'hi', tmid, user);
			await flush();

			// The message record created by the send — the one changeMessageStatus will update.
			const messageId = [...messages.records.keys()].find(id => id !== tmid) as string;
			expect(messageId).toBeDefined();
			const messageRecord = messages.records.get(messageId) as FakeRecord;

			const concurrentGate = deferred();
			const concurrentWrite = db.write(async () => {
				await concurrentGate.promise;
				await db.batch([
					messageRecord.prepareUpdate((m: FakeRecord) => {
						m.msg = 'edited by another writer';
					})
				]);
			});

			post.resolve();
			await flush();
			concurrentGate.resolve();

			await expect(Promise.all([concurrentWrite, send])).resolves.toBeDefined();

			expect(loggedPendingChanges()).toBe(false);

			const threadMessageRecord = mockGetCollection('thread_messages').records.get(messageId) as FakeRecord;
			expect(messageRecord.status).toBe(messagesStatus.SENT);
			expect(threadMessageRecord.status).toBe(messagesStatus.SENT);

			// The status update reached db.batch as one commit — it is the only batch holding both
			// records — and neither was left prepared-but-uncommitted.
			const statusBatch = mockDbBatch.mock.calls
				.map(call => call.flat())
				.find(items => items.includes(messageRecord) && items.includes(threadMessageRecord));
			expect(statusBatch).toBeDefined();
			expect(messageRecord._preparedState).toBeNull();
			expect(threadMessageRecord._preparedState).toBeNull();
		});
	});
});
