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
	const record: { id: string; tmsg: string | undefined; stale: boolean; prepareUpdate: jest.Mock } = {
		id,
		tmsg: undefined,
		stale: false,
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
});
