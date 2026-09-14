import database from '../database';
import log from './helpers/log';
import { messagesStatus } from '../constants/messagesStatus';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants/keys';
import { resendMessage, sendMessage } from './sendMessage';
import {
	createBatchMock,
	createWriterLock,
	deferred,
	flush,
	loggedPendingChanges,
	makeFakeRecord
} from '../database/__tests__/mockedWatermelonDB';

type FakeRecord = Record<string, any>;

interface FakeCollection {
	schema: Record<string, unknown>;
	records: Map<string, FakeRecord>;
	find: (id: string) => Promise<FakeRecord>;
	prepareCreate: (updater: (m: FakeRecord) => void) => FakeRecord;
}

const makeRecord = (debugName: string, fields: FakeRecord = {}): FakeRecord => makeFakeRecord(debugName, fields);

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
				record.id = id;
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

const mockDbBatch = createBatchMock();
const mockDbWrite = createWriterLock();

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: (name: string) => mockGetCollection(name),
			write: (callback: () => Promise<void>) => mockDbWrite(callback),
			batch: (...args: unknown[]) => mockDbBatch(...args)
		}
	}
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: (raw: unknown) => raw
}));

const mockEncryptionGate: { promise: Promise<void> | null } = { promise: null };
const mockEncryptMessage = jest.fn<Promise<any>, any[]>();
const defaultEncryptMessage = async (message: unknown) => {
	if (mockEncryptionGate.promise) {
		await mockEncryptionGate.promise;
	}
	return message;
};
jest.mock('../encryption', () => ({
	Encryption: {
		encryptMessage: (...args: unknown[]) => mockEncryptMessage(...args)
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

describe('sendMessage', () => {
	const rid = 'GENERAL';
	const user = { id: 'userId', username: 'rocket.cat', name: 'Rocket Cat' };

	beforeEach(() => {
		jest.clearAllMocks();
		collections = {};
		mockEncryptionGate.promise = null;
		mockEncryptMessage.mockReset();
		mockEncryptMessage.mockImplementation(defaultEncryptMessage);
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

			expect(loggedPendingChanges(log)).toBe(false);
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

			expect(loggedPendingChanges(log)).toBe(false);

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

	const batchedRecords = (call = 0): FakeRecord[] => (mockDbBatch.mock.calls[call] ?? []).flat() as FakeRecord[];

	const batchedFrom = (table: string, call = 0): FakeRecord[] => batchedRecords(call).filter(record => record.table === table);

	// The single record `table` got a prepareCreate for in the send batch.
	const createdRecord = (table: string, exclude: string[] = []): FakeRecord =>
		[...mockGetCollection(table).records.entries()].filter(([id]) => !exclude.includes(id)).map(([, record]) => record)[0];

	const encrypted = (extra: Record<string, unknown>) =>
		mockEncryptMessage.mockImplementation((message: Record<string, unknown>) => Promise.resolve({ ...message, ...extra }));

	describe('sendMessage - message record', () => {
		it('creates the optimistic message with TEMP status, the user and the send date', async () => {
			const before = Date.now();
			const post = deferred();
			mockPost.mockImplementation(async () => {
				await post.promise;
				return { success: true, message: {} };
			});

			const send = sendMessage(rid, 'hello', undefined, user);
			await flush();
			const after = Date.now();

			const record = createdRecord('messages');
			expect(record.msg).toBe('hello');
			expect(record.status).toBe(messagesStatus.TEMP);
			expect(record.u).toEqual({ _id: 'userId', username: 'rocket.cat', name: 'Rocket Cat' });
			expect(record.ts).toBeInstanceOf(Date);
			expect(record.ts.getTime()).toBeGreaterThanOrEqual(before);
			expect(record.ts.getTime()).toBeLessThanOrEqual(after);
			expect(record._updatedAt).toBe(record.ts);
			expect(batchedRecords()).toContain(record);

			post.resolve();
			await send;
		});

		it('writes the message to the database before calling the server', async () => {
			await sendMessage(rid, 'hello', undefined, user);

			expect(mockDbBatch).toHaveBeenCalled();
			expect(mockPost).toHaveBeenCalledWith('chat.sendMessage', { message: expect.objectContaining({ msg: 'hello' }) });
			expect(mockDbBatch.mock.invocationCallOrder[0]).toBeLessThan(mockPost.mock.invocationCallOrder[0]);
		});

		it("falls back to '1' as the author id when the user has none", async () => {
			await sendMessage(rid, 'hello', undefined, { username: 'rocket.cat', name: 'Rocket Cat' });

			expect(createdRecord('messages').u).toEqual({ _id: '1', username: 'rocket.cat', name: 'Rocket Cat' });
		});

		it('flags the message as e2e done when the encrypted message is an e2e one', async () => {
			encrypted({ t: E2E_MESSAGE_TYPE });

			await sendMessage(rid, 'hello', undefined, user);

			const record = createdRecord('messages');
			expect(record.t).toBe(E2E_MESSAGE_TYPE);
			expect(record.e2e).toBe(E2E_STATUS.DONE);
		});
	});

	describe('sendMessage - server response', () => {
		it('marks the message as sent and applies mentions and channels on success', async () => {
			const message = { mentions: [{ _id: 'mentioned' }], channels: [{ _id: 'channel' }] };
			mockPost.mockImplementation(() => Promise.resolve({ success: true, message }));

			await sendMessage(rid, 'hello', undefined, user);

			const record = createdRecord('messages');
			expect(record.status).toBe(messagesStatus.SENT);
			expect(record.mentions).toBe(message.mentions);
			expect(record.channels).toBe(message.channels);
		});

		it('marks the message as errored when the server answers success: false', async () => {
			mockPost.mockImplementation(() => Promise.resolve({ success: false }));

			await sendMessage(rid, 'hello', undefined, user);

			expect(createdRecord('messages').status).toBe(messagesStatus.ERROR);
		});

		it('marks the message as errored when the request rejects', async () => {
			mockPost.mockImplementation(() => Promise.reject(new Error('offline')));

			await expect(sendMessage(rid, 'hello', undefined, user)).resolves.toBeUndefined();

			expect(createdRecord('messages').status).toBe(messagesStatus.ERROR);
		});
	});

	describe('sendMessage - failures', () => {
		it('logs and skips the request when the write fails', async () => {
			mockDbBatch.mockImplementationOnce(() => Promise.reject(new Error('batch failed')));

			await expect(sendMessage(rid, 'hello', undefined, user)).resolves.toBeUndefined();

			expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'batch failed' }));
			expect(mockPost).not.toHaveBeenCalled();
		});

		it('logs and writes nothing when encryption fails', async () => {
			mockEncryptMessage.mockImplementation(() => Promise.reject(new Error('encryption failed')));

			await expect(sendMessage(rid, 'hello', undefined, user)).resolves.toBeUndefined();

			expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'encryption failed' }));
			expect(mockDbBatch).not.toHaveBeenCalled();
			expect(mockPost).not.toHaveBeenCalled();
		});
	});

	describe('sendMessage - draft', () => {
		it('clears the draft of the room it is sending to', async () => {
			const subscriptions = mockGetCollection('subscriptions');
			const room = makeRecord(`subscriptions#${rid}`, { draftMessage: 'a draft' });
			subscriptions.records.set(rid, room);

			await sendMessage(rid, 'hello', undefined, user);

			expect(batchedRecords()).toContain(room);
			expect(room.draftMessage).toBeNull();
		});

		it('adds no draft update when the room has no draft', async () => {
			const subscriptions = mockGetCollection('subscriptions');
			const room = makeRecord(`subscriptions#${rid}`, { draftMessage: null });
			subscriptions.records.set(rid, room);

			await sendMessage(rid, 'hello', undefined, user);

			expect(batchedRecords()).not.toContain(room);
			expect(room._preparedState).toBeNull();
		});

		it('still sends when the subscription cannot be found', async () => {
			mockGetCollection('subscriptions');

			await sendMessage(rid, 'hello', undefined, user);

			expect(mockDbBatch).toHaveBeenCalled();
			expect(mockPost).toHaveBeenCalled();
			expect(createdRecord('messages').status).toBe(messagesStatus.SENT);
		});
	});

	describe('sendMessage - thread reply', () => {
		const tmid = 'threadHeaderId';
		const headerFields = {
			msg: 'thread header',
			ts: new Date(0),
			tcount: 2,
			u: { _id: 'other', username: 'other' },
			attachments: [{ title: 'file' }]
		};

		const seedHeader = (fields: FakeRecord = {}) => {
			const messages = mockGetCollection('messages');
			const header = makeRecord(`messages#${tmid}`, { ...headerFields, ...fields });
			messages.records.set(tmid, header);
			return header;
		};

		it('bumps the thread header last message date and reply count', async () => {
			const header = seedHeader();
			const before = Date.now();

			await sendMessage(rid, 'reply', tmid, user);

			expect(batchedRecords()).toContain(header);
			expect(header.tcount).toBe(3);
			expect(header.tlm).toBeInstanceOf(Date);
			expect(header.tlm.getTime()).toBeGreaterThanOrEqual(before);
		});

		it('leaves the reply count untouched when it is zero', async () => {
			const header = seedHeader({ tcount: 0 });

			await sendMessage(rid, 'reply', tmid, user);

			expect(header.tcount).toBe(0);
			expect(header.tlm).toBeInstanceOf(Date);
		});

		it('creates the thread record seeded from the header when there is none', async () => {
			const header = seedHeader();

			await sendMessage(rid, 'reply', tmid, user);

			const thread = createdRecord('threads');
			expect(thread.id).toBe(tmid);
			expect(thread.tmid).toBe(tmid);
			expect(thread.msg).toBe(header.msg);
			expect(thread.ts).toBe(header.ts);
			expect(thread.u).toBe(header.u);
			expect(thread.attachments).toBe(header.attachments);
			expect(thread.status).toBe(messagesStatus.SENT);
			expect(batchedRecords()).toContain(thread);
		});

		it('creates no thread record when one already exists', async () => {
			seedHeader();
			const threads = mockGetCollection('threads');
			threads.records.set(tmid, makeRecord(`threads#${tmid}`, { msg: 'thread header' }));

			await sendMessage(rid, 'reply', tmid, user);

			expect(threads.records.size).toBe(1);
			expect(batchedFrom('threads')).toHaveLength(0);
		});

		it('creates the reply in thread_messages with TEMP status and the user', async () => {
			seedHeader();
			const post = deferred();
			mockPost.mockImplementation(async () => {
				await post.promise;
				return { success: true, message: {} };
			});

			const send = sendMessage(rid, 'reply', tmid, user);
			await flush();

			const threadMessage = createdRecord('thread_messages');
			expect(threadMessage.rid).toBe(tmid);
			expect(threadMessage.msg).toBe('reply');
			expect(threadMessage.status).toBe(messagesStatus.TEMP);
			expect(threadMessage.u).toEqual({ _id: 'userId', username: 'rocket.cat', name: 'Rocket Cat' });
			expect(batchedRecords()).toContain(threadMessage);

			post.resolve();
			await send;
		});

		it('flags the thread and the reply as e2e done for an e2e message', async () => {
			seedHeader();
			encrypted({ t: E2E_MESSAGE_TYPE });

			await sendMessage(rid, 'reply', tmid, user);

			expect(createdRecord('threads').e2e).toBe(E2E_STATUS.DONE);
			expect(createdRecord('thread_messages').e2e).toBe(E2E_STATUS.DONE);
		});

		it('copies the thread header onto the message when tshow is set', async () => {
			const header = seedHeader();

			await sendMessage(rid, 'reply', tmid, user, true);

			const record = createdRecord('messages', [tmid]);
			expect(record.tmid).toBe(tmid);
			expect(record.tmsg).toBe(header.msg);
			expect(record.tshow).toBe(true);
		});

		it('logs and sends a plain message when the thread header is missing', async () => {
			mockGetCollection('messages');

			await sendMessage(rid, 'reply', tmid, user);

			expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: `Record messages#${tmid} not found` }));
			const record = createdRecord('messages');
			expect(record.tmid).toBeUndefined();
			expect(record.tmsg).toBeUndefined();
			expect(batchedFrom('threads')).toHaveLength(0);
			expect(batchedFrom('thread_messages')).toHaveLength(0);
			expect(mockPost).toHaveBeenCalled();
		});

		it('confirms both the message and the thread message on success', async () => {
			seedHeader();

			await sendMessage(rid, 'reply', tmid, user);

			expect(createdRecord('messages', [tmid]).status).toBe(messagesStatus.SENT);
			expect(createdRecord('thread_messages').status).toBe(messagesStatus.SENT);
		});
	});

	describe('resendMessage', () => {
		const makeMessageModel = (fields: FakeRecord = {}): FakeRecord => {
			const model: FakeRecord = {
				id: 'messageId',
				msg: 'hello',
				subscription: { id: rid },
				status: messagesStatus.ERROR,
				...fields
			};
			model.update = jest.fn((updater: (m: FakeRecord) => void) => Promise.resolve(updater(model)));
			return model;
		};

		it('marks the message as temp, re-encrypts it and sends it again', async () => {
			const message = makeMessageModel();

			await resendMessage(message as any);

			expect(message.update).toHaveBeenCalled();
			expect(message.status).toBe(messagesStatus.TEMP);
			expect(mockEncryptMessage).toHaveBeenCalledWith({ _id: 'messageId', rid, msg: 'hello' });
			expect(mockPost).toHaveBeenCalledWith('chat.sendMessage', {
				message: { _id: 'messageId', rid, msg: 'hello' }
			});
		});

		it('sends an empty rid when the message has no subscription', async () => {
			await resendMessage(makeMessageModel({ subscription: undefined }) as any);

			expect(mockEncryptMessage).toHaveBeenCalledWith(expect.objectContaining({ rid: '' }));
		});

		it('keeps the thread id when resending a thread reply', async () => {
			await resendMessage(makeMessageModel() as any, 'threadHeaderId');

			expect(mockEncryptMessage).toHaveBeenCalledWith(expect.objectContaining({ tmid: 'threadHeaderId' }));
		});

		it('logs and does not rethrow when the update fails', async () => {
			const message = makeMessageModel();
			message.update = jest.fn(() => Promise.reject(new Error('update failed')));

			await expect(resendMessage(message as any)).resolves.toBeUndefined();

			expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'update failed' }));
			expect(mockPost).not.toHaveBeenCalled();
		});

		it('logs and does not rethrow when encryption fails', async () => {
			mockEncryptMessage.mockImplementation(() => Promise.reject(new Error('encryption failed')));

			await expect(resendMessage(makeMessageModel() as any)).resolves.toBeUndefined();

			expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'encryption failed' }));
			expect(mockPost).not.toHaveBeenCalled();
		});
	});
});
