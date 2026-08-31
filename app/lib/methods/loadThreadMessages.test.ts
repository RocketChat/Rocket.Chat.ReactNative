import { loadThreadMessages } from './loadThreadMessages';
import database from '../database';
import { getThreadById } from '../database/services/Thread';
import { Encryption } from '../encryption';
import sdk from '../services/sdk';

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

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

jest.mock('ejson', () => ({
	__esModule: true,
	default: { fromJSONValue: (value: any) => value }
}));

const mockedMethodCall = sdk.methodCallWrapper as jest.MockedFunction<typeof sdk.methodCallWrapper>;
const mockedGetThreadById = getThreadById as jest.MockedFunction<typeof getThreadById>;

const TMID = 'PARENT_ID';
const RID = 'ROOM_ID';

const buildParent = (updatedAt: Date, reactions: any) => ({
	_id: TMID,
	rid: RID,
	msg: 'parent',
	tlm: new Date(),
	tcount: 1,
	_updatedAt: updatedAt,
	reactions
});

const buildReply = () => ({ _id: 'REPLY_ID', rid: RID, tmid: TMID, msg: 'reply', _updatedAt: new Date() });

let batched: any[] = [];
let threadsCreated: any[] = [];

const setupDatabase = () => {
	batched = [];
	threadsCreated = [];
	const threadsCollection = {
		schema: {},
		prepareCreate: jest.fn((fn: any) => {
			const record: any = {};
			fn(record);
			threadsCreated.push(record);
			return record;
		})
	};
	const threadMessagesCollection = {
		schema: {},
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) })),
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

	it('decrypts the parent along with the replies', async () => {
		const parent = buildParent(new Date('2026-01-02'), []);
		mockedMethodCall.mockResolvedValue([parent, buildReply()] as any);
		mockedGetThreadById.mockResolvedValue(null);

		await loadThreadMessages({ tmid: TMID, rid: RID });

		expect(Encryption.decryptMessages).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ _id: TMID })]));
	});
});
