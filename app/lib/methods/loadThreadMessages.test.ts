import {
	hasMoreThreadMessages,
	loadAllThreadMessages,
	loadMoreThreadMessages,
	loadThreadMessages,
	subscribeThreadLoaded
} from './loadThreadMessages';
import { type IReaction } from '~/definitions';
import database from '../database';
import { getThreadById } from '../database/services/Thread';
import { Encryption } from '../encryption';
import { getSingleMessage, getThreadMessagesDdp, getThreadMessagesPage, isThreadMessagesPaginated } from '../services/restApi';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import buildMessage from './helpers/buildMessage';
import log from './helpers/log';

jest.mock('../services/restApi', () => ({
	getSingleMessage: jest.fn(),
	getThreadMessagesDdp: jest.fn(),
	getThreadMessagesPage: jest.fn(),
	isThreadMessagesPaginated: jest.fn(() => false)
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

const mockedMethodCall = getThreadMessagesDdp as jest.MockedFunction<typeof getThreadMessagesDdp>;
const mockedGetSingleMessage = getSingleMessage as jest.Mock;
const mockedGetPage = getThreadMessagesPage as jest.Mock;
const mockedIsPaginated = isThreadMessagesPaginated as jest.Mock;
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

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(threadRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(threadsCollection.prepareCreate).not.toHaveBeenCalled();
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

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(lookupError);
		expect(dbBatch()).not.toHaveBeenCalled();
	});

	it('logs and still resolves when preparing the threads create fails', async () => {
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
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
		mockedMethodCall.mockResolvedValue([buildParent(new Date('2026-01-02'), []), buildReply()] as any);
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

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(getError);
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

	it('logs inner DB failures and still resolves without rejecting', async () => {
		mockedMethodCall.mockResolvedValue([unitReply('R1', NEW)] as any);
		const dbError = new Error('batch boom');
		dbBatch().mockRejectedValueOnce(dbError);

		await expect(loadThreadMessages({ tmid: TMID, rid: RID })).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(dbError);
	});
});

describe('thread message pagination', () => {
	const reply = (id: string) => ({ _id: id, rid: RID, tmid: TMID, msg: id, _updatedAt: new Date() });
	const parent = () => buildParent(new Date('2026-01-02'), []);

	beforeEach(() => {
		jest.clearAllMocks();
		setupDatabase();
		mockedIsPaginated.mockReturnValue(true);
		mockedGetThreadById.mockResolvedValue(null);
		mockedGetSingleMessage.mockResolvedValue({ success: true, message: parent() });
	});

	afterEach(() => {
		mockedIsPaginated.mockReturnValue(false);
	});

	it('loads the root and only the first page when opening a thread', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1'), reply('R2')], total: 5 });

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetPage).toHaveBeenCalledTimes(1);
		expect(mockedGetPage).toHaveBeenCalledWith({ tmid: TMID, offset: 0 });
		expect(threadsCreated).toHaveLength(1);
		expect(hasMoreThreadMessages(TMID)).toBe(true);
	});

	it('keeps the replies when the root message fails to load', async () => {
		mockedGetSingleMessage.mockRejectedValueOnce(new Error('boom'));
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(threadsCreated).toHaveLength(0);
		expect(hasMoreThreadMessages(TMID)).toBe(true);
	});

	it('logs and returns nothing when the first page fails', async () => {
		mockedGetPage.mockRejectedValueOnce(new Error('429'));

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalled();
	});

	it('retries the first page on the next load more when it failed', async () => {
		const retryTmid = 'retry-tmid';
		mockedGetPage.mockRejectedValueOnce(new Error('500'));
		await loadThreadMessages({ tmid: retryTmid, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });

		await loadMoreThreadMessages({ tmid: retryTmid, rid: RID });

		expect(mockedGetPage).toHaveBeenLastCalledWith({ tmid: retryTmid, offset: 0 });
		expect(hasMoreThreadMessages(retryTmid)).toBe(true);
	});

	it('requests the first page again when saving it failed', async () => {
		const saveFailTmid = 'save-fail-tmid';
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		mockedDecryptMessages.mockRejectedValueOnce(new Error('db'));
		await loadThreadMessages({ tmid: saveFailTmid, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });

		await loadMoreThreadMessages({ tmid: saveFailTmid, rid: RID });

		expect(hasMoreThreadMessages(saveFailTmid)).toBe(true);
		expect(mockedGetPage).toHaveBeenLastCalledWith({ tmid: saveFailTmid, offset: 0 });
	});

	it('reports no more messages when the first page holds the whole thread', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 1 });

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});

	it('fetches the next page from the number of replies already fetched', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1'), reply('R2')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R3')], total: 3 });

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetPage).toHaveBeenLastCalledWith({ tmid: TMID, offset: 2 });
		expect(threadsCreated).toHaveLength(1);
		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});

	it('does not request another page while one is in flight', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R2')], total: 3 });

		await Promise.all([loadMoreThreadMessages({ tmid: TMID, rid: RID }), loadMoreThreadMessages({ tmid: TMID, rid: RID })]);

		expect(mockedGetPage).toHaveBeenCalledTimes(2);
	});

	it('waits for a reload in flight instead of requesting a stale page', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 5 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		let release!: (page: { messages: ReturnType<typeof reply>[]; total: number }) => void;
		mockedGetPage.mockReturnValueOnce(new Promise(resolve => (release = resolve)));

		const reload = loadThreadMessages({ tmid: TMID, rid: RID });
		const more = loadMoreThreadMessages({ tmid: TMID, rid: RID });
		release({ messages: [reply('R1')], total: 5 });
		await Promise.all([reload, more]);

		expect(mockedGetPage).toHaveBeenCalledTimes(2);
		expect(mockedGetPage).toHaveBeenLastCalledWith({ tmid: TMID, offset: 0 });
	});

	it('does not call the server when there is nothing more to load', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 1 });
		await loadThreadMessages({ tmid: TMID, rid: RID });

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetPage).toHaveBeenCalledTimes(1);
	});

	it('keeps more messages available and logs when a page request fails', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockRejectedValueOnce(new Error('boom'));

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalled();
		expect(hasMoreThreadMessages(TMID)).toBe(true);
	});

	it('stops when the server returns an empty page', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 5 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [], total: 5 });

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});

	it('loads every remaining page when asked to load all', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage
			.mockResolvedValueOnce({ messages: [reply('R2')], total: 3 })
			.mockResolvedValueOnce({ messages: [reply('R3')], total: 3 });

		await expect(loadAllThreadMessages({ tmid: TMID, rid: RID })).resolves.toBe(true);

		expect(mockedGetPage).toHaveBeenCalledTimes(3);
		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});

	it('waits for the first load before loading all', async () => {
		mockedGetPage
			.mockResolvedValueOnce({ messages: [reply('R1')], total: 2 })
			.mockResolvedValueOnce({ messages: [reply('R2')], total: 2 });

		const first = loadThreadMessages({ tmid: TMID, rid: RID });
		await expect(loadAllThreadMessages({ tmid: TMID, rid: RID })).resolves.toBe(true);
		await first;

		expect(mockedGetPage).toHaveBeenCalledTimes(2);
		expect(mockedGetPage).toHaveBeenLastCalledWith({ tmid: TMID, offset: 1 });
	});

	it('notifies subscribers when a load finishes', async () => {
		const listener = jest.fn();
		const unsubscribe = subscribeThreadLoaded(listener);
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 1 });

		await loadThreadMessages({ tmid: TMID, rid: RID });
		unsubscribe();
		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(TMID);
	});

	it('gives up on load all when a page request fails', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockRejectedValue(new Error('boom'));

		await expect(loadAllThreadMessages({ tmid: TMID, rid: RID })).resolves.toBe(false);

		expect(mockedGetPage).toHaveBeenCalledTimes(2);
	});

	it('reports more messages by the time the first page is written to the database', async () => {
		let hasMoreWhenWritten: boolean | undefined;
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		dbBatch().mockImplementationOnce(() => {
			hasMoreWhenWritten = hasMoreThreadMessages(TMID);
		});

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(hasMoreWhenWritten).toBe(true);
	});

	it('reports the advanced page state by the time a later page is written to the database', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 2 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		let hasMoreWhenWritten: boolean | undefined;
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R2')], total: 2 });
		dbBatch().mockImplementationOnce(() => {
			hasMoreWhenWritten = hasMoreThreadMessages(TMID);
		});

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(hasMoreWhenWritten).toBe(false);
	});

	it('does not adopt the pagination state of a first page that failed to save', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 1 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		dbBatch().mockImplementationOnce(() => {
			throw new Error('db');
		});

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedLog).toHaveBeenCalled();
		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});

	it('requests the same page again after saving it failed', async () => {
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R1')], total: 3 });
		await loadThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R2')], total: 3 });
		dbBatch().mockImplementationOnce(() => {
			throw new Error('db');
		});
		await loadMoreThreadMessages({ tmid: TMID, rid: RID });
		mockedGetPage.mockResolvedValueOnce({ messages: [reply('R2')], total: 3 });

		await loadMoreThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetPage).toHaveBeenNthCalledWith(2, { tmid: TMID, offset: 1 });
		expect(mockedGetPage).toHaveBeenNthCalledWith(3, { tmid: TMID, offset: 1 });
		expect(hasMoreThreadMessages(TMID)).toBe(true);
	});

	it('loads the whole thread over DDP and reports no more on older servers', async () => {
		mockedIsPaginated.mockReturnValue(false);
		mockedMethodCall.mockResolvedValue([parent(), reply('R1')] as any);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(mockedGetPage).not.toHaveBeenCalled();
		expect(hasMoreThreadMessages(TMID)).toBe(false);
	});
});
