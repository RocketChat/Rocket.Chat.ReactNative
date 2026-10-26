import getThreadName from './getThreadName';
import database from '../database';
import { getMessageById } from '../database/services/Message';
import { getThreadById } from '../database/services/Thread';
import getSingleMessage from './getSingleMessage';
import { Encryption } from '../encryption';
import log from './helpers/log';

jest.mock('../database', () => ({
	__esModule: true,
	default: { active: {} }
}));

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('./getSingleMessage', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../encryption', () => ({
	Encryption: { decryptMessage: jest.fn() }
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedGetThreadById = getThreadById as jest.MockedFunction<typeof getThreadById>;
const mockedGetSingleMessage = getSingleMessage as jest.MockedFunction<typeof getSingleMessage>;
const mockedDecryptMessage = Encryption.decryptMessage as jest.MockedFunction<typeof Encryption.decryptMessage>;
const mockedLog = log as jest.MockedFunction<typeof log>;

// mimics watermelon rejecting an update prepared on a record another writer already touched
const buildMessageRecord = (id: string) => {
	const record: {
		id: string;
		tmsg: string | undefined;
		stale: boolean;
		prepareUpdate: jest.Mock;
		update: jest.Mock;
	} = {
		id,
		tmsg: undefined,
		stale: false,
		update: jest.fn((updater: (m: any) => void) => {
			updater(record);
			return record;
		}),
		prepareUpdate: jest.fn((updater: (m: any) => void) => {
			if (record.stale) {
				throw new Error('Cannot update a record with pending changes');
			}
			updater(record);
			return record;
		})
	};
	return record;
};

describe('getThreadName', () => {
	const batch = jest.fn();
	const threadCollection = { schema: {}, prepareCreate: jest.fn((cb: (t: any) => void) => cb({}) ?? { type: 'thread' }) };

	beforeEach(() => {
		jest.clearAllMocks();
		batch.mockResolvedValue(undefined);
		(database as any).active = {
			get: jest.fn(() => threadCollection),
			write: jest.fn((fn: () => Promise<void>) => fn()),
			batch
		};
	});

	it('re-fetches the message inside the write so a concurrent writer during the network gap does not break the update', async () => {
		const staleRecord = buildMessageRecord('MESSAGE_ID');
		const freshRecord = buildMessageRecord('MESSAGE_ID');
		mockedGetMessageById.mockResolvedValue(staleRecord as any);

		mockedGetThreadById.mockResolvedValue(null as any);

		mockedGetSingleMessage.mockImplementation(() => {
			// a sync write lands while we are off the lock: the old record is superseded
			staleRecord.stale = true;
			mockedGetMessageById.mockResolvedValue(freshRecord as any);
			return Promise.resolve({ _id: 'THREAD_ID', msg: 'thread name' } as any);
		});
		mockedDecryptMessage.mockImplementation((message: any) => Promise.resolve(message));

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBe('thread name');
		expect(mockedLog).not.toHaveBeenCalled();
		expect(staleRecord.prepareUpdate).not.toHaveBeenCalled();
		expect(freshRecord.prepareUpdate).toHaveBeenCalledTimes(1);
		expect(freshRecord.tmsg).toBe('thread name');
		expect(batch).toHaveBeenCalledTimes(1);
		// the message is read again only after the network and decryption work
		expect(mockedGetMessageById).toHaveBeenCalledTimes(2);
	});

	it('updates the message when the local thread name differs from the cached tmsg', async () => {
		const record = buildMessageRecord('MESSAGE_ID');
		record.tmsg = 'old name';
		mockedGetMessageById.mockResolvedValue(record as any);
		mockedGetThreadById.mockResolvedValue({ msg: 'new name' } as any);

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBe('new name');
		expect(record.update).toHaveBeenCalledTimes(1);
		expect(record.tmsg).toBe('new name');
		expect(mockedGetSingleMessage).not.toHaveBeenCalled();
		expect(batch).not.toHaveBeenCalled();
	});

	it('does not write when the cached tmsg already matches the local thread', async () => {
		const record = buildMessageRecord('MESSAGE_ID');
		record.tmsg = 'same name';
		mockedGetMessageById.mockResolvedValue(record as any);
		mockedGetThreadById.mockResolvedValue({ msg: 'same name' } as any);

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBe('same name');
		expect((database.active as any).write).not.toHaveBeenCalled();
		expect(record.update).not.toHaveBeenCalled();
	});

	it('falls back to the first attachment title when the local thread has no msg', async () => {
		const record = buildMessageRecord('MESSAGE_ID');
		mockedGetMessageById.mockResolvedValue(record as any);
		mockedGetThreadById.mockResolvedValue({ msg: undefined, attachments: [{ title: 'attachment title' }] } as any);

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBe('attachment title');
		expect(record.tmsg).toBe('attachment title');
	});

	it('skips creating the thread when another writer created it during the network gap', async () => {
		const record = buildMessageRecord('MESSAGE_ID');
		mockedGetMessageById.mockResolvedValue(record as any);
		mockedGetThreadById.mockResolvedValueOnce(null as any).mockResolvedValueOnce({ msg: 'thread name' } as any);
		mockedGetSingleMessage.mockResolvedValue({ _id: 'THREAD_ID', msg: 'thread name' } as any);
		mockedDecryptMessage.mockImplementation((message: any) => Promise.resolve(message));

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBe('thread name');
		expect(batch).not.toHaveBeenCalled();
		expect(threadCollection.prepareCreate).not.toHaveBeenCalled();
		expect(record.update).toHaveBeenCalledTimes(1);
		expect(record.tmsg).toBe('thread name');
	});

	it('logs and resolves undefined when fetching the remote thread fails', async () => {
		const error = new Error('network down');
		mockedGetMessageById.mockResolvedValue(buildMessageRecord('MESSAGE_ID') as any);
		mockedGetThreadById.mockResolvedValue(null as any);
		mockedGetSingleMessage.mockRejectedValue(error);

		const tmsg = await getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_ID');

		expect(tmsg).toBeUndefined();
		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(batch).not.toHaveBeenCalled();
	});

	it('creates the thread once when two callers race for the same tmid', async () => {
		const storedThreadIds = new Set<string>();
		let writeQueue: Promise<unknown> = Promise.resolve();
		const threadsCollection = {
			schema: {},
			prepareCreate: jest.fn((cb: (t: any) => void) => {
				const raw: any = {};
				cb({
					set _raw(value: any) {
						Object.assign(raw, value);
					},
					get _raw() {
						return raw;
					}
				});
				return { id: raw.id, table: 'threads' };
			})
		};
		(database as any).active = {
			get: jest.fn(() => threadsCollection),
			write: jest.fn((fn: () => Promise<void>) => {
				const run = writeQueue.then(fn);
				writeQueue = run.catch(() => {});
				return run;
			}),
			batch: jest.fn((...records: any[]) => {
				records.forEach(record => {
					if (record?.table !== 'threads') return;
					if (storedThreadIds.has(record.id)) {
						throw new Error('UNIQUE constraint failed: threads.id');
					}
					storedThreadIds.add(record.id);
				});
				return Promise.resolve();
			})
		};

		const messageRecords = ['MESSAGE_A', 'MESSAGE_B'].map(buildMessageRecord);
		mockedGetMessageById.mockImplementation(id => Promise.resolve(messageRecords.find(message => message.id === id) as any));
		mockedGetThreadById.mockImplementation(() =>
			Promise.resolve(storedThreadIds.has('THREAD_ID') ? ({ msg: 'thread name' } as any) : null)
		);
		mockedGetSingleMessage.mockResolvedValue({ _id: 'THREAD_ID', msg: 'thread name' } as any);
		mockedDecryptMessage.mockImplementation((message: any) => Promise.resolve(message));

		await Promise.all([getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_A'), getThreadName('ROOM_ID', 'THREAD_ID', 'MESSAGE_B')]);

		expect(mockedLog).not.toHaveBeenCalled();
		expect(threadsCollection.prepareCreate).toHaveBeenCalledTimes(1);
		expect(messageRecords.map(message => message.tmsg)).toEqual(['thread name', 'thread name']);
	});
});
