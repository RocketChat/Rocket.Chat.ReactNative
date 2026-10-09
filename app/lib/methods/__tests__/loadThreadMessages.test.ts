import { Q } from '@nozbe/watermelondb';

import {
	subscribeThreadLoaded,
	areOlderThreadMessagesMissing,
	clearThreadPagination,
	loadMoreThreadMessages,
	loadThreadMessages,
	loadThreadMessagesUntil
} from '../loadThreadMessages';
import { type IReaction } from '~/definitions';
import database from '../../database';
import { getThreadById } from '../../database/services/Thread';
import { getThreadMessageById } from '../../database/services/ThreadMessage';
import { Encryption } from '../../encryption';
import { getThreadMessages } from '../../services/restApi';
import getSingleMessage from '../getSingleMessage';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import buildMessage from '../helpers/buildMessage';
import log from '../helpers/log';

jest.mock('../../services/restApi', () => ({
	getThreadMessages: jest.fn()
}));

jest.mock('../getSingleMessage', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: {} }
}));

jest.mock('../../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('../../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../encryption', () => ({
	Encryption: { decryptMessages: jest.fn((messages: any) => Promise.resolve(messages)) }
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../helpers/buildMessage', () => ({
	__esModule: true,
	default: jest.fn((message: any) => message)
}));

jest.mock('../helpers/protectedFunction', () => ({
	__esModule: true,
	default:
		(fn: (...args: any[]) => unknown) =>
		(...args: any[]) =>
			fn(...args)
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

const mockedGetThreadMessages = getThreadMessages as jest.Mock;
const mockedGetSingleMessage = getSingleMessage as jest.Mock;
const mockedGetThreadById = getThreadById as jest.MockedFunction<typeof getThreadById>;
const mockedGetThreadMessageById = getThreadMessageById as jest.Mock;
const mockedBuildMessage = buildMessage as jest.MockedFunction<typeof buildMessage>;
const mockedDecryptMessages = Encryption.decryptMessages as jest.Mock;
const mockedLog = log as jest.Mock;
const mockedSanitizedRaw = sanitizedRaw as jest.Mock;

const TMID = 'PARENT_ID';
const RID = 'ROOM_ID';

interface IParentFixture {
	_id: string;
	rid: string;
	msg: string;
	tlm: Date;
	tcount: number;
	_updatedAt: Date;
	reactions: Partial<IReaction>[];
}

interface IReplyFixture {
	_id: string;
	rid: string;
	tmid: string;
	msg: string;
	_updatedAt: Date;
}

const buildParent = (updatedAt: Date, reactions: Partial<IReaction>[]): IParentFixture => ({
	_id: TMID,
	rid: RID,
	msg: 'parent',
	tlm: new Date(),
	tcount: 1,
	_updatedAt: updatedAt,
	reactions
});

const buildReply = (): IReplyFixture => ({ _id: 'REPLY_ID', rid: RID, tmid: TMID, msg: 'reply', _updatedAt: new Date() });

let batched: any[] = [];
let threadsCreated: any[] = [];
let threadMessagesCollection: any;
let threadsCollection: any;
let threadMessageRecords: any[] = [];

const setThreadMessageRecords = (records: any[]): void => {
	threadMessageRecords = records;
};

const setupDatabase = (): void => {
	batched = [];
	threadsCreated = [];
	threadMessageRecords = [];
	threadsCollection = {
		schema: {},
		prepareCreate: jest.fn((fn: any) => {
			const record: any = {};
			fn(record);
			threadsCreated.push(record);
			return record;
		})
	};
	threadMessagesCollection = {
		schema: {},
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve(threadMessageRecords)) })),
		prepareCreate: jest.fn((fn: any) => {
			const record: any = {};
			fn(record);
			return record;
		})
	};
	(database as any).active = {
		get: jest.fn((table: string) => (table === 'threads' ? threadsCollection : threadMessagesCollection)),
		write: jest.fn((fn: any) => fn()),
		batch: jest.fn((records: any[]) => {
			batched = records;
		})
	};
};

const makeLocalThreadMessage = ({ id, updatedAt, attachments }: { id: string; updatedAt: Date; attachments?: any[] }): any => {
	const record: any = { id, _updatedAt: updatedAt };
	if (attachments !== undefined) {
		record.attachments = attachments;
	}
	record.prepareUpdate = jest.fn((fn: any) => {
		fn(record);
		return record;
	});
	return record;
};

const mockThread = (messages: any[]) => mockedGetThreadMessages.mockResolvedValue({ messages, total: messages.length });

const dbWrite = (): jest.Mock => (database as any).active.write as jest.Mock;
const dbBatch = (): jest.Mock => (database as any).active.batch as jest.Mock;

describe('loadThreadMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setupDatabase();
		mockedGetSingleMessage.mockRejectedValue(new Error('not found'));
	});

	it('creates the threads record from the parent returned by getThreadMessages', async () => {
		const parent = buildParent(new Date('2026-01-02'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		mockThread([parent, buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadsCreated).toHaveLength(1);
		expect(threadsCreated[0].reactions).toEqual(parent.reactions);
		expect(threadsCreated[0].subscription).toBeUndefined();
		expect(batched).toContain(threadsCreated[0]);
	});

	it('points the created threads record at the room subscription', async () => {
		// NOTE: rid differs from parent.rid so the assertion proves the value comes from the rid parameter, not the parent.
		const parent = { ...buildParent(new Date('2026-01-02'), []), subscription: { id: 'OLD_SUB_ID' } };
		mockThread([parent, buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: 'OTHER_ROOM_ID' });

		expect(threadsCollection.prepareCreate).toHaveBeenCalledTimes(1);
		expect(threadsCreated).toHaveLength(1);
		expect(threadsCreated[0].subscription.id).toBe('OTHER_ROOM_ID');
		expect(threadsCreated[0]._raw).toEqual({ id: TMID });
		expect(batched).toContain(threadsCreated[0]);
	});

	it('updates a stale threads record so newer reactions reach the UI', async () => {
		const parent = buildParent(new Date('2026-01-02'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		mockThread([parent, buildReply()]);

		const updated: any = {};
		const threadRecord = {
			id: TMID,
			_updatedAt: new Date('2026-01-01'),
			prepareUpdate: jest.fn((fn: any) => {
				fn(updated);
				return updated;
			})
		};
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).toHaveBeenCalled();
		expect(updated.reactions).toEqual(parent.reactions);
		expect(batched).toContain(updated);
	});

	it('leaves an up-to-date threads record untouched', async () => {
		mockThread([buildParent(new Date('2026-01-01'), []), buildReply()]);

		const threadRecord = { id: TMID, _updatedAt: new Date('2026-01-01'), prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCreated).toHaveLength(0);
	});

	it('leaves a newer threads record untouched and still writes the replies', async () => {
		mockThread([buildParent(new Date('2026-01-01'), []), buildReply()]);

		const threadRecord = { id: TMID, _updatedAt: new Date('2026-01-02'), prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCollection.prepareCreate).not.toHaveBeenCalled();
		expect(batched).toHaveLength(1);
		expect(batched[0]._id).toBe('REPLY_ID');
	});

	it('does not write the parent into thread_messages', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		const threadMessageRecords = batched.filter(r => !threadsCreated.includes(r));
		expect(threadMessageRecords).toHaveLength(1);
		expect(threadMessageRecords[0]._id).toBe('REPLY_ID');
	});

	it('still resolves when the server returns no parent', async () => {
		mockThread([buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetThreadById).not.toHaveBeenCalled();
		expect(threadsCreated).toHaveLength(0);
	});

	it('drops messages buildMessage could not normalize before decrypting', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), null, buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(Encryption.decryptMessages).toHaveBeenCalledWith([
			expect.objectContaining({ _id: TMID }),
			expect.objectContaining({ _id: 'REPLY_ID' })
		]);
		expect(threadsCreated).toHaveLength(1);
	});

	it('decrypts the parent along with the replies', async () => {
		const parent = buildParent(new Date('2026-01-02'), []);
		mockThread([parent, buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(Encryption.decryptMessages).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ _id: TMID })]));
	});

	it('batches the thread upsert together with message creates and updates in one write', async () => {
		const parent = buildParent(new Date('2026-01-03'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		const updated: any = {};
		const threadRecord = {
			id: TMID,
			_updatedAt: new Date('2026-01-02'),
			prepareUpdate: jest.fn((fn: any) => {
				fn(updated);
				return updated;
			})
		};
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		const localReply = makeLocalThreadMessage({ id: 'R1', updatedAt: new Date('2026-01-01') });
		localReply.msg = 'old';
		setThreadMessageRecords([localReply]);
		mockThread([
			parent,
			{ _id: 'R1', rid: RID, tmid: TMID, msg: 'new', _updatedAt: new Date('2026-01-02') },
			{ _id: 'R2', rid: RID, tmid: TMID, msg: 'reply', _updatedAt: new Date('2026-01-02') }
		]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetThreadById).toHaveBeenCalledWith(TMID);
		expect(database.active.get as jest.Mock).toHaveBeenCalledWith('threads');
		expect(threadRecord.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(updated.reactions).toEqual(parent.reactions);
		expect(localReply.msg).toBe('new');
		expect(dbWrite()).toHaveBeenCalledTimes(1);
		expect(dbBatch()).toHaveBeenCalledTimes(1);
		const batchArg = dbBatch().mock.calls[0][0];
		expect(batchArg).toHaveLength(3);
		expect(batchArg[0]).toBe(updated);
		expect(batchArg).toContain(updated);
		expect(batchArg).toContain(localReply);
		expect(batchArg).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'R2' })]));
	});

	it('logs and still resolves when the threads lookup fails', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		const lookupError = new Error('threads lookup boom');
		mockedGetThreadById.mockRejectedValue(lookupError);

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(lookupError);
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('logs and still resolves when preparing the threads create fails', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);
		const createError = new Error('threads create boom');
		threadsCollection.prepareCreate.mockImplementationOnce(() => {
			throw createError;
		});

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(createError);
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('logs and still resolves when preparing the threads update fails', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		const updateError = new Error('threads update boom');
		mockedGetThreadById.mockResolvedValue({
			id: TMID,
			_updatedAt: new Date('2026-01-01'),
			prepareUpdate: jest.fn(() => {
				throw updateError;
			})
		} as any);

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(updateError);
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('does not touch the threads collection when the server returns no parent', async () => {
		mockThread([buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		const getMock = database.active.get as jest.Mock;
		expect(getMock).toHaveBeenCalledWith('thread_messages');
		expect(getMock).not.toHaveBeenCalledWith('threads');
		expect(mockedGetThreadById).not.toHaveBeenCalled();
	});

	it('updates a stale threads record when local _updatedAt is a timestamp number', async () => {
		const parent = buildParent(new Date('2026-01-02T00:00:00.000Z'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		mockThread([parent, buildReply()]);

		const updated: any = {};
		const threadRecord = {
			id: TMID,
			_updatedAt: new Date('2026-01-01T00:00:00.000Z').getTime(),
			prepareUpdate: jest.fn((fn: any) => {
				fn(updated);
				return updated;
			})
		};
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(updated.reactions).toEqual(parent.reactions);
		expect(batched).toContain(updated);
	});

	it('updates a stale threads record when local _updatedAt is an ISO string', async () => {
		mockThread([buildParent(new Date('2026-01-02T00:00:00.000Z'), []), buildReply()]);

		const threadRecord = { id: TMID, _updatedAt: '2026-01-01T00:00:00.000Z', prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(threadsCreated).toHaveLength(0);
	});

	it('updates a stale threads record from a thread parent whose _updatedAt is an ISO string', async () => {
		mockThread([{ ...buildParent(new Date(), []), _updatedAt: '2026-01-02T00:00:00.000Z' }, buildReply()]);
		const threadRecord = { id: TMID, _updatedAt: new Date('2026-01-01T00:00:00.000Z'), prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).toHaveBeenCalledTimes(1);
	});

	it('logs and still resolves when getting the threads collection fails', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);
		const getError = new Error('threads get boom');
		(database.active.get as jest.Mock).mockImplementation((table: string) => {
			if (table === 'threads') {
				throw getError;
			}
			return threadMessagesCollection;
		});

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(getError);
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('sanitizes the threads raw id from the parent _id', async () => {
		mockThread([buildParent(new Date('2026-01-02'), []), buildReply()]);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedSanitizedRaw).toHaveBeenCalledWith({ id: TMID }, threadsCollection.schema);
		expect(mockedSanitizedRaw).toHaveBeenCalledWith({ id: 'REPLY_ID' }, threadMessagesCollection.schema);
	});
});

describe('loadThreadMessages thread_messages unit', () => {
	const OLD = new Date('2026-01-01T00:00:00.000Z');
	const NEW = new Date('2026-01-02T00:00:00.000Z');

	const unitReply = (id: string, updatedAt: Date, extra: Record<string, unknown> = {}): any => ({
		_id: id,
		tmid: TMID,
		msg: `msg-${id}`,
		_updatedAt: updatedAt,
		attachments: [{ image_url: `/file/${id}.png` }],
		...extra
	});

	beforeEach(() => {
		jest.clearAllMocks();
		setupDatabase();
		mockedGetSingleMessage.mockRejectedValue(new Error('not found'));
		setThreadMessageRecords([]);
		mockedGetThreadById.mockResolvedValue(null);
		mockedBuildMessage.mockImplementation((message: any) => message);
		mockedDecryptMessages.mockImplementation((messages: any) => Promise.resolve(messages));
	});

	it('swallows SDK throws and resolves empty without rejecting', async () => {
		mockedGetThreadMessages.mockRejectedValue(new Error('boom'));

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedDecryptMessages).not.toHaveBeenCalled();
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('resolves undefined on empty data without decrypting or batching', async () => {
		mockThread([]);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(result).toBeUndefined();
		expect(mockedDecryptMessages).not.toHaveBeenCalled();
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('filters out messages without tmid before creating thread_messages', async () => {
		// NOTE: buildMessage/decrypt still see every truthy row (parent included);
		// the tmid filter runs after decrypt, just before the create/update diff.
		const reply1 = unitReply('R1', NEW);
		const reply2 = unitReply('R2', NEW);
		const orphan1 = { _id: 'ORPHAN-1', msg: 'orphan', _updatedAt: NEW };
		const orphan2 = { _id: 'ORPHAN-2', msg: 'orphan', _updatedAt: NEW };
		mockThread([orphan1, reply1, orphan2, reply2]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedBuildMessage).toHaveBeenCalledTimes(4);
		expect(threadMessagesCollection.prepareCreate).toHaveBeenCalledTimes(2);
		expect(batched.map((r: any) => r._id).sort()).toEqual(['R1', 'R2']);
	});

	it('maps each surviving message through buildMessage', async () => {
		mockThread([unitReply('R1', NEW), unitReply('R2', NEW)]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedBuildMessage).toHaveBeenCalledTimes(2);
		expect(mockedBuildMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ _id: 'R1' }));
		expect(mockedBuildMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ _id: 'R2' }));
	});

	it('decrypts the built list before diffing', async () => {
		mockThread([unitReply('R1', NEW), unitReply('R2', NEW)]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedDecryptMessages).toHaveBeenCalledTimes(1);
		expect(mockedDecryptMessages).toHaveBeenCalledWith([
			expect.objectContaining({ _id: 'R1' }),
			expect.objectContaining({ _id: 'R2' })
		]);
		expect(threadMessagesCollection.query).toHaveBeenCalled();
		expect(mockedDecryptMessages.mock.invocationCallOrder[0]).toBeLessThan(
			threadMessagesCollection.query.mock.invocationCallOrder[0]
		);
	});

	it('creates thread_messages absent locally (dedupe _id === id) with rid=tmid', async () => {
		setThreadMessageRecords([makeLocalThreadMessage({ id: 'R1', updatedAt: NEW })]);
		mockThread([unitReply('R1', NEW), unitReply('R2', NEW)]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadMessagesCollection.prepareCreate).toHaveBeenCalledTimes(1);
		const created = batched.find((r: any) => r._id === 'R2');
		expect(created).toBeDefined();
		expect(created.rid).toBe(TMID);
		expect(created._raw).toEqual({ id: 'R2' });
		expect(batched.some((r: any) => r._id === 'R1' && r._raw)).toBe(false);
	});

	it('updates stale records via prepareUpdate while retaining existing attachments', async () => {
		const storedAttachments = [{ image_url: '/file/old.png', title_link: 'file://old.png' }];
		const local = makeLocalThreadMessage({ id: 'R1', updatedAt: OLD, attachments: storedAttachments });
		local.msg = 'old';
		setThreadMessageRecords([local]);
		mockThread([unitReply('R1', NEW, { msg: 'new', attachments: [{ image_url: '/file/new.png' }] })]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(local.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(local.msg).toBe('new');
		expect(local.attachments).toBe(storedAttachments);
		expect(batched).toContain(local);
	});

	it('updates stale records from thread messages whose _updatedAt is an ISO string', async () => {
		const local = makeLocalThreadMessage({ id: 'R1', updatedAt: OLD });
		setThreadMessageRecords([local]);
		mockThread([unitReply('R1', NEW, { _updatedAt: NEW.toISOString(), msg: 'edited' })]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(local.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(local.msg).toBe('edited');
	});

	it('does not update records when local _updatedAt >= incoming _updatedAt', async () => {
		const newer = makeLocalThreadMessage({ id: 'R1', updatedAt: NEW });
		newer.msg = 'stored-newer';
		const equal = makeLocalThreadMessage({ id: 'R2', updatedAt: NEW });
		equal.msg = 'stored-equal';
		setThreadMessageRecords([newer, equal]);
		mockThread([unitReply('R1', OLD, { msg: 'stale' }), unitReply('R2', NEW, { msg: 'same' })]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(newer.prepareUpdate).not.toHaveBeenCalled();
		expect(equal.prepareUpdate).not.toHaveBeenCalled();
		expect(threadMessagesCollection.prepareCreate).not.toHaveBeenCalled();
		expect(batched).not.toContain(newer);
		expect(batched).not.toContain(equal);
		expect(batched).toHaveLength(0);
	});

	it('writes creates and updates via db.write then db.batch once', async () => {
		const localToUpdate = makeLocalThreadMessage({ id: 'R1', updatedAt: OLD });
		localToUpdate.msg = 'old';
		setThreadMessageRecords([localToUpdate]);
		mockThread([unitReply('R1', NEW, { msg: 'new' }), unitReply('R2', NEW)]);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(dbWrite()).toHaveBeenCalledTimes(1);
		expect(dbBatch()).toHaveBeenCalledTimes(1);
		const batchArg = dbBatch().mock.calls[0][0];
		expect(batchArg).toHaveLength(2);
		expect(batchArg).toContain(localToUpdate);
		expect(batchArg).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'R2' })]));
	});

	it('logs inner DB failures and still resolves without rejecting', async () => {
		mockThread([unitReply('R1', NEW)]);
		const dbError = new Error('batch boom');
		dbBatch().mockRejectedValueOnce(dbError);

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(dbError);
	});
});

describe('thread message pagination', () => {
	let threadCount = 0;
	let thread: { tmid: string; rid: string };

	const tsOf = (id: string) => new Date(Date.UTC(2026, 0, 1) - Number(id.slice(1)) * 1000);
	const target = (id: string) => ({ id, ts: tsOf(id) });
	const wanted = () => true;
	const threadMessage = (id: string) => ({ _id: id, rid: RID, tmid: thread.tmid, msg: id, ts: tsOf(id), _updatedAt: new Date() });
	const page = (total: number, ...ids: string[]) => ({ messages: ids.map(threadMessage), total });
	const loadFirstPage = async (total: number, ...ids: string[]) => {
		mockedGetThreadMessages.mockResolvedValueOnce(page(total, ...ids));
		await loadThreadMessages(thread);
	};
	const failNextWrite = () => dbBatch().mockRejectedValueOnce(new Error('db'));
	const flushPromises = () => new Promise(resolve => setImmediate(resolve));
	const deferPage = () => {
		let release!: (result: ReturnType<typeof page>) => void;
		mockedGetThreadMessages.mockReturnValueOnce(new Promise(resolve => (release = resolve)));
		return (total: number, ...ids: string[]) => release(page(total, ...ids));
	};
	const captureMissingOnWrite = () => {
		const captured: { missing?: boolean } = {};
		dbBatch().mockImplementationOnce(() => {
			captured.missing = areOlderThreadMessagesMissing(thread.tmid);
		});
		return captured;
	};
	let storedIds: Set<string>;

	beforeEach(() => {
		jest.clearAllMocks();
		setupDatabase();
		threadCount += 1;
		thread = { tmid: `PAGED_THREAD_${threadCount}`, rid: RID };
		mockedGetThreadMessages.mockReset();
		mockedGetThreadById.mockResolvedValue(null);
		mockedGetSingleMessage.mockResolvedValue({ ...buildParent(new Date('2026-01-02'), []), _id: thread.tmid });
		storedIds = new Set();
		mockedGetThreadMessageById.mockImplementation((id: string) => Promise.resolve(storedIds.has(id) ? { id } : null));
		dbBatch().mockImplementation((records: any[]) => {
			batched = records;
			records.forEach(record => storedIds.add(record._id));
		});
	});

	it('loads the thread parent and only the first page when opening a thread', async () => {
		await loadFirstPage(5, 'R1', 'R2');

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(1);
		expect(mockedGetThreadMessages).toHaveBeenCalledWith({ tmid: thread.tmid, offset: 0 });
		expect(mockedGetSingleMessage).toHaveBeenCalledWith(thread.tmid);
		expect(threadsCreated).toHaveLength(1);
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('keeps the thread messages when the thread parent fails to load', async () => {
		mockedGetSingleMessage.mockRejectedValueOnce(new Error('boom'));

		await loadFirstPage(3, 'R1');

		expect(threadsCreated).toHaveLength(0);
		expect(batched.map((r: any) => r._id)).toEqual(['R1']);
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('logs when the first page fails and reports nothing older to load', async () => {
		mockedGetThreadMessages.mockRejectedValueOnce(new Error('429'));

		await loadThreadMessages(thread);

		expect(mockedLog).toHaveBeenCalled();
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('retries the first page on the next load more when it failed', async () => {
		mockedGetThreadMessages.mockRejectedValueOnce(new Error('500'));
		await loadThreadMessages(thread);
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R1'));

		await loadMoreThreadMessages(thread);

		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 0 });
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('requests the first page again when saving it failed', async () => {
		failNextWrite();
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R1'));

		await loadMoreThreadMessages(thread);

		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 0 });
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('reports nothing older to load when the first page holds the whole thread', async () => {
		await loadFirstPage(1, 'R1');

		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('fetches the next page from the number of thread messages already fetched, without the thread parent', async () => {
		await loadFirstPage(3, 'R1', 'R2');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R3'));

		await loadMoreThreadMessages(thread);

		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 2 });
		expect(mockedGetSingleMessage).toHaveBeenCalledTimes(1);
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('does not request another page while one is in flight', async () => {
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R2'));

		await Promise.all([loadMoreThreadMessages(thread), loadMoreThreadMessages(thread)]);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
	});

	it('requests the first page once when opening the thread races an older load', async () => {
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R1'));

		await Promise.all([loadMoreThreadMessages(thread), loadThreadMessages(thread)]);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(1);
		expect(mockedGetSingleMessage).toHaveBeenCalledTimes(1);
	});

	it('waits for a reload in flight instead of requesting a stale page', async () => {
		await loadFirstPage(5, 'R1');
		const releaseReload = deferPage();

		const reload = loadThreadMessages(thread);
		const older = loadMoreThreadMessages(thread);
		releaseReload(5, 'R1');
		await Promise.all([reload, older]);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 0 });
	});

	it('does not call the server when there is nothing more to load', async () => {
		await loadFirstPage(1, 'R1');

		await loadMoreThreadMessages(thread);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(1);
	});

	it('keeps older thread messages missing and logs when a page request fails', async () => {
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockRejectedValueOnce(new Error('boom'));

		await loadMoreThreadMessages(thread);

		expect(mockedLog).toHaveBeenCalled();
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('stops when the server returns an empty page', async () => {
		await loadFirstPage(5, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(5));

		await loadMoreThreadMessages(thread);

		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('loads older pages only until the page holding the target is fetched', async () => {
		await loadFirstPage(7, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(7, 'R2')).mockResolvedValueOnce(page(7, 'R3'));

		await expect(loadThreadMessagesUntil(thread, target('R2'), wanted)).resolves.toBe(true);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
	});

	it('does not call the server when the target is within the fetched pages', async () => {
		await loadFirstPage(7, 'R1', 'R2');

		await expect(loadThreadMessagesUntil(thread, target('R2'), wanted)).resolves.toBe(true);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(1);
	});

	it('pages down to a stored target that is older than the fetched pages', async () => {
		await loadFirstPage(7, 'R1');
		storedIds.add('R3');
		mockedGetThreadMessages.mockResolvedValueOnce(page(7, 'R2')).mockResolvedValueOnce(page(7, 'R3'));

		await expect(loadThreadMessagesUntil(thread, target('R3'), wanted)).resolves.toBe(true);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(3);
	});

	it('loads every remaining page to reveal the thread parent', async () => {
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R2')).mockResolvedValueOnce(page(3, 'R3'));

		await expect(loadThreadMessagesUntil(thread, { id: thread.tmid, ts: new Date() }, wanted)).resolves.toBe(true);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(3);
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('reports a target deleted from the thread as unreachable', async () => {
		await loadFirstPage(2, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R2'));

		await expect(loadThreadMessagesUntil(thread, { id: 'deleted', ts: tsOf('R5') }, wanted)).resolves.toBe(false);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
	});

	it('stops paging once the jump no longer wants the target', async () => {
		await loadFirstPage(9, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(9, 'R2')).mockResolvedValueOnce(page(9, 'R3'));
		const isWanted = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

		await expect(loadThreadMessagesUntil(thread, target('R5'), isWanted)).resolves.toBe(false);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
	});

	it('waits for the first load before loading until the target', async () => {
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R1')).mockResolvedValueOnce(page(2, 'R2'));

		const first = loadThreadMessages(thread);
		await expect(loadThreadMessagesUntil(thread, target('R2'), wanted)).resolves.toBe(true);
		await first;

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 1 });
	});

	it('loads the first page before older ones when none was loaded', async () => {
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R1')).mockResolvedValueOnce(page(2, 'R2'));

		await expect(loadThreadMessagesUntil(thread, target('R2'), wanted)).resolves.toBe(true);

		expect(mockedGetThreadMessages).toHaveBeenNthCalledWith(1, { tmid: thread.tmid, offset: 0 });
		expect(mockedGetThreadMessages).toHaveBeenNthCalledWith(2, { tmid: thread.tmid, offset: 1 });
	});

	it('reports the target as unreachable when the first page cannot be fetched', async () => {
		mockedGetThreadMessages.mockRejectedValue(new Error('boom'));

		await expect(loadThreadMessagesUntil(thread, target('R1'), wanted)).resolves.toBe(false);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(1);
	});

	it('gives up loading until the target when a page request fails', async () => {
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockRejectedValue(new Error('boom'));

		await expect(loadThreadMessagesUntil(thread, target('R3'), wanted)).resolves.toBe(false);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(2);
	});

	it('notifies subscribers when a load finishes', async () => {
		const listener = jest.fn();
		const removeListener = subscribeThreadLoaded(listener);

		await loadFirstPage(1, 'R1');
		removeListener();
		await loadFirstPage(1, 'R1');

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('reports older thread messages missing by the time the first page is written to the database', async () => {
		const captured = captureMissingOnWrite();

		await loadFirstPage(3, 'R1');

		expect(captured.missing).toBe(true);
	});

	it('reports no older thread messages missing by the time the last page is written to the database', async () => {
		await loadFirstPage(2, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R2'));
		const captured = captureMissingOnWrite();

		await loadMoreThreadMessages(thread);

		expect(captured.missing).toBe(false);
	});

	it('does not adopt the pagination state of a first page that failed to save', async () => {
		await loadFirstPage(1, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R1'));
		failNextWrite();

		await loadThreadMessages(thread);

		expect(mockedLog).toHaveBeenCalled();
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('requests the same page again after saving it failed', async () => {
		await loadFirstPage(3, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R2'));
		failNextWrite();
		await loadMoreThreadMessages(thread);
		mockedGetThreadMessages.mockResolvedValueOnce(page(3, 'R2'));

		await loadMoreThreadMessages(thread);

		expect(mockedGetThreadMessages).toHaveBeenNthCalledWith(2, { tmid: thread.tmid, offset: 1 });
		expect(mockedGetThreadMessages).toHaveBeenNthCalledWith(3, { tmid: thread.tmid, offset: 1 });
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('keeps no older thread messages missing when the first page is reloaded after the oldest was stored', async () => {
		await loadFirstPage(2, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R2'));
		await loadMoreThreadMessages(thread);

		await loadFirstPage(2, 'R2');

		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(false);
	});

	it('forgets the reached oldest page once the thread view closes', async () => {
		await loadFirstPage(2, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R2'));
		await loadMoreThreadMessages(thread);

		clearThreadPagination(thread.tmid);
		await loadFirstPage(2, 'R1');

		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('drops a page that lands after its thread view closed', async () => {
		await loadFirstPage(2, 'R1');
		mockedGetThreadMessages.mockResolvedValueOnce(page(2, 'R2'));
		await loadMoreThreadMessages(thread);
		const releaseReload = deferPage();
		const reload = loadThreadMessages(thread);
		await flushPromises();

		clearThreadPagination(thread.tmid);
		releaseReload(2, 'R1');
		await reload;
		await loadFirstPage(3, 'R1');

		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('does not reuse an older page left in flight by a closed thread view as the first page', async () => {
		await loadFirstPage(5, 'R1');
		const releaseOlder = deferPage();
		const older = loadMoreThreadMessages(thread);
		await flushPromises();

		clearThreadPagination(thread.tmid);
		mockedGetThreadMessages.mockResolvedValueOnce(page(5, 'R1'));
		const reopen = loadThreadMessages(thread);
		releaseOlder(5, 'R2');
		await Promise.all([older, reopen]);

		expect(mockedGetThreadMessages).toHaveBeenLastCalledWith({ tmid: thread.tmid, offset: 0 });
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('drops a first page that lands after its thread view closed', async () => {
		const releaseFirst = deferPage();
		const first = loadThreadMessages(thread);
		await flushPromises();

		clearThreadPagination(thread.tmid);
		releaseFirst(1, 'R1');
		await first;

		expect(dbBatch()).not.toHaveBeenCalled();
		await loadFirstPage(3, 'R1');
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('requests the first page again when the thread reopens while a reload is in flight', async () => {
		await loadFirstPage(5, 'R1');
		const releaseReload = deferPage();
		const reload = loadThreadMessages(thread);
		await flushPromises();

		clearThreadPagination(thread.tmid);
		mockedGetThreadMessages.mockResolvedValueOnce(page(5, 'R1'));
		const reopen = loadThreadMessages(thread);
		releaseReload(5, 'R1');
		await Promise.all([reload, reopen]);

		expect(mockedGetThreadMessages).toHaveBeenCalledTimes(3);
		expect(areOlderThreadMessagesMissing(thread.tmid)).toBe(true);
	});

	it('queries only the stored records of the thread messages being saved', async () => {
		await loadFirstPage(3, 'R1', 'R2');

		expect(threadMessagesCollection.query).toHaveBeenCalledWith(Q.where('id', Q.oneOf(['R1', 'R2'])));
	});
});
