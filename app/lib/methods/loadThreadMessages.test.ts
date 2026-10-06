import { loadThreadMessages } from './loadThreadMessages';
import { type IReaction } from '~/definitions';
import database from '../database';
import { getThreadById } from '../database/services/Thread';
import { Encryption } from '../encryption';
import sdk from '../services/sdk';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import buildMessage from './helpers/buildMessage';
import log from './helpers/log';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: { methodCallWrapper: jest.fn() }
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: { active: {} }
}));

jest.mock('../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../encryption', () => ({
	Encryption: { decryptMessages: jest.fn((messages: any) => Promise.resolve(messages)) }
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('./helpers/buildMessage', () => ({
	__esModule: true,
	default: jest.fn((message: any) => message)
}));

jest.mock('./helpers/protectedFunction', () => ({
	__esModule: true,
	default:
		(fn: (...args: any[]) => unknown) =>
		(...args: any[]) =>
			fn(...args)
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

jest.mock('ejson', () => ({
	__esModule: true,
	default: { fromJSONValue: (value: any) => value }
}));

const mockedMethodCall = sdk.methodCallWrapper as jest.MockedFunction<typeof sdk.methodCallWrapper>;
const mockedGetThreadById = getThreadById as jest.MockedFunction<typeof getThreadById>;
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

const dbWrite = (): jest.Mock => (database as any).active.write as jest.Mock;
const dbBatch = (): jest.Mock => (database as any).active.batch as jest.Mock;

describe('loadThreadMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setupDatabase();
	});

	it('creates the threads record from the parent returned by getThreadMessages', async () => {
		const parent = buildParent(new Date('2026-01-02'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);
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
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);
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
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);

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
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-01'), []), buildReply()] as any);

		const threadRecord = { id: TMID, _updatedAt: new Date('2026-01-01'), prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCreated).toHaveLength(0);
	});

	it('leaves a newer threads record untouched and still writes the replies', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-01'), []), buildReply()] as any);

		const threadRecord = { id: TMID, _updatedAt: new Date('2026-01-02'), prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCollection.prepareCreate).not.toHaveBeenCalled();
		expect(result).toEqual([expect.objectContaining({ _id: 'REPLY_ID' })]);
		expect(batched).toHaveLength(1);
		expect(batched[0]._id).toBe('REPLY_ID');
	});

	it('does not write the parent into thread_messages', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		const threadMessageRecords = batched.filter(r => !threadsCreated.includes(r));
		expect(threadMessageRecords).toHaveLength(1);
		expect(threadMessageRecords[0]._id).toBe('REPLY_ID');
	});

	it('still resolves when the server returns no parent', async () => {
		mockedMethodCall.mockResolvedValue([buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetThreadById).not.toHaveBeenCalled();
		expect(threadsCreated).toHaveLength(0);
	});

	it('drops messages buildMessage could not normalize before decrypting', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), null, buildReply()] as any);
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
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);
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
		mockedMethodCall.mockResolvedValue([
			parent,
			{ _id: 'R1', rid: RID, tmid: TMID, msg: 'new', _updatedAt: new Date('2026-01-02') },
			{ _id: 'R2', rid: RID, tmid: TMID, msg: 'reply', _updatedAt: new Date('2026-01-02') }
		] as any);

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
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
		const lookupError = new Error('threads lookup boom');
		mockedGetThreadById.mockRejectedValue(lookupError);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalledWith(lookupError);
		expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'REPLY_ID' })]));
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('logs and still resolves when preparing the threads create fails', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);
		const createError = new Error('threads create boom');
		threadsCollection.prepareCreate.mockImplementationOnce(() => {
			throw createError;
		});

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalledWith(createError);
		expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'REPLY_ID' })]));
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('logs and still resolves when preparing the threads update fails', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
		const updateError = new Error('threads update boom');
		mockedGetThreadById.mockResolvedValue({
			id: TMID,
			_updatedAt: new Date('2026-01-01'),
			prepareUpdate: jest.fn(() => {
				throw updateError;
			})
		} as any);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalledWith(updateError);
		expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'REPLY_ID' })]));
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('does not touch the threads collection when the server returns no parent', async () => {
		mockedMethodCall.mockResolvedValue([buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		const getMock = database.active.get as jest.Mock;
		expect(getMock).toHaveBeenCalledWith('thread_messages');
		expect(getMock).not.toHaveBeenCalledWith('threads');
		expect(mockedGetThreadById).not.toHaveBeenCalled();
	});

	it('updates a stale threads record when local _updatedAt is a timestamp number', async () => {
		const parent = buildParent(new Date('2026-01-02T00:00:00.000Z'), [{ emoji: ':thumbsup:', usernames: ['rocket.cat'] }]);
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);

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

	it('does not update when local _updatedAt is a string mixed with a Date parent', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02T00:00:00.000Z'), []), buildReply()] as any);

		const threadRecord = { id: TMID, _updatedAt: '2026-01-01T00:00:00.000Z', prepareUpdate: jest.fn() };
		mockedGetThreadById.mockResolvedValue(threadRecord as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCreated).toHaveLength(0);
	});

	it('logs and still resolves when getting the threads collection fails', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);
		const getError = new Error('threads get boom');
		(database.active.get as jest.Mock).mockImplementation((table: string) => {
			if (table === 'threads') {
				throw getError;
			}
			return threadMessagesCollection;
		});

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalledWith(getError);
		expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'REPLY_ID' })]));
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('sanitizes the threads raw id from the parent _id', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
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
		setThreadMessageRecords([]);
		mockedGetThreadById.mockResolvedValue(null);
		mockedBuildMessage.mockImplementation((message: any) => message);
		mockedDecryptMessages.mockImplementation((messages: any) => Promise.resolve(messages));
	});

	it('resolves empty when the SDK returns a falsy result without decrypting or touching the DB', async () => {
		mockedMethodCall.mockResolvedValue(null as any);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(result).toBeUndefined();
		expect(mockedDecryptMessages).not.toHaveBeenCalled();
		expect(threadMessagesCollection.query).not.toHaveBeenCalled();
		expect(dbWrite()).not.toHaveBeenCalled();
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('swallows SDK throws and resolves empty without rejecting', async () => {
		mockedMethodCall.mockRejectedValue(new Error('boom'));

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedDecryptMessages).not.toHaveBeenCalled();
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('resolves undefined on empty data without decrypting or batching', async () => {
		mockedMethodCall.mockResolvedValue([] as any);

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
		mockedMethodCall.mockResolvedValue([orphan1, reply1, orphan2, reply2] as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedBuildMessage).toHaveBeenCalledTimes(4);
		expect(threadMessagesCollection.prepareCreate).toHaveBeenCalledTimes(2);
		expect(batched.map((r: any) => r._id).sort()).toEqual(['R1', 'R2']);
	});

	it('maps each surviving message through buildMessage', async () => {
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW), unitReply('R2', NEW)] as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedBuildMessage).toHaveBeenCalledTimes(2);
		expect(mockedBuildMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ _id: 'R1' }));
		expect(mockedBuildMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ _id: 'R2' }));
	});

	it('decrypts the built list before diffing', async () => {
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW), unitReply('R2', NEW)] as any);

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
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW), unitReply('R2', NEW)] as any);

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
		mockedMethodCall.mockResolvedValue([
			unitReply('R1', NEW, { msg: 'new', attachments: [{ image_url: '/file/new.png' }] })
		] as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(local.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(local.msg).toBe('new');
		expect(local.attachments).toBe(storedAttachments);
		expect(batched).toContain(local);
	});

	it('does not update records when local _updatedAt >= incoming _updatedAt', async () => {
		const newer = makeLocalThreadMessage({ id: 'R1', updatedAt: NEW });
		newer.msg = 'stored-newer';
		const equal = makeLocalThreadMessage({ id: 'R2', updatedAt: NEW });
		equal.msg = 'stored-equal';
		setThreadMessageRecords([newer, equal]);
		mockedMethodCall.mockResolvedValue([unitReply('R1', OLD, { msg: 'stale' }), unitReply('R2', NEW, { msg: 'same' })] as any);

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
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW, { msg: 'new' }), unitReply('R2', NEW)] as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(dbWrite()).toHaveBeenCalledTimes(1);
		expect(dbBatch()).toHaveBeenCalledTimes(1);
		const batchArg = dbBatch().mock.calls[0][0];
		expect(batchArg).toHaveLength(2);
		expect(batchArg).toContain(localToUpdate);
		expect(batchArg).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'R2' })]));
	});

	it('logs inner DB failures and still resolves data without rejecting', async () => {
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW)] as any);
		const dbError = new Error('batch boom');
		dbBatch().mockRejectedValueOnce(dbError);

		const result = await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalledWith(dbError);
		expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ _id: 'R1' })]));
	});
});
