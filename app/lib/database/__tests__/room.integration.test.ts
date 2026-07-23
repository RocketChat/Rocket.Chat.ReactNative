import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { IMessage, TMessageModel } from '../../../definitions';
import {
	closeLokiTestDatabase,
	createLokiTestDatabase,
	resetLokiTestDatabase,
	seedMessage,
	seedSubscription,
	withWriterQueueDiagnosticCleared
} from './lokiTestDatabase';
import RoomSubscription from '../../methods/subscriptions/room';
import { Encryption } from '../../encryption';
import log from '../../methods/helpers/log';

// Real persistence + real writer lock: point `database.active` at the live LokiJS DB so
// `RoomSubscription.updateMessage` drives the real WMDB `db.write` serialization and the
// real `getMessageById` / `getThreadById` / `getThreadMessageById` services. Only the outer
// edges are mocked: `sdk`/`readMessages`/`loadMissedMessages` (never reached by updateMessage),
// `auxStore` (dispatch), `encryption` (pass-through decryption hook), `log`.
let mockActiveDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockActiveDatabase;
		}
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({ login: {}, settings: {}, room: {} }),
		dispatch: jest.fn()
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribeRoom: jest.fn(() => Promise.resolve([])),
		onStreamData: jest.fn(() => Promise.resolve({ stop: jest.fn() }))
	}
}));

jest.mock('../../encryption', () => ({
	Encryption: { decryptMessage: jest.fn((message: unknown) => Promise.resolve(message)) }
}));

jest.mock('../../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('../../methods/readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../methods/loadMissedMessages', () => ({ loadMissedMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../methods/helpers/markMessagesRead', () => ({ __esModule: true, default: jest.fn() }));

const decryptMessage = Encryption.decryptMessage as unknown as jest.Mock;
const mockedLog = log as unknown as jest.Mock;

const RID = 'room-1';
const T1 = Date.UTC(2026, 6, 22, 12, 0, 0);
const T2 = T1 + 1000;

// A stream message as it reaches `updateMessage` (already built/decrypted upstream). `ts` and
// `_updatedAt` are explicit Dates: updateMessage does `Object.assign(record, message)` verbatim,
// so whatever is passed is what persists.
const streamMessage = (overrides: Partial<IMessage> = {}): IMessage =>
	({
		_id: 'msg-1',
		rid: RID,
		msg: 'hello',
		ts: new Date(T1),
		_updatedAt: new Date(T1),
		u: { _id: 'user-1', username: 'user-1' },
		...overrides
	} as unknown as IMessage);

const findMessage = async (id: string): Promise<TMessageModel | null> => {
	try {
		return (await mockActiveDatabase.get('messages').find(id)) as TMessageModel;
	} catch {
		return null;
	}
};

const messageCount = async (): Promise<number> =>
	(await mockActiveDatabase.get('messages').query(Q.where('rid', RID)).fetch()).length;

describe('RoomSubscription.updateMessage (LokiJS integration)', () => {
	let sub: RoomSubscription;

	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	afterAll(() => closeLokiTestDatabase(mockActiveDatabase));

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		decryptMessage.mockClear();
		decryptMessage.mockImplementation((message: unknown) => Promise.resolve(message));
		mockedLog.mockClear();
		sub = new RoomSubscription(RID);
	});

	it('creates a new message row and runs the decryption hook (create path)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID });

		await sub.updateMessage(streamMessage({ _id: 'created', msg: 'first' }));

		const row = await findMessage('created');
		expect(row?.msg).toBe('first');
		expect(row?.subscription?.id).toBe(RID);
		expect(decryptMessage).toHaveBeenCalledTimes(1);
		expect(mockedLog).not.toHaveBeenCalled();
	});

	it('updates an existing message row in place without duplicating it (update path)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID });
		await seedMessage(mockActiveDatabase, { id: 'edited', rid: RID, msg: 'before', updatedAt: new Date(T1) });

		await sub.updateMessage(streamMessage({ _id: 'edited', msg: 'after', _updatedAt: new Date(T2) }));

		const row = await findMessage('edited');
		expect(row?.msg).toBe('after');
		expect(await messageCount()).toBe(1);
		expect(mockedLog).not.toHaveBeenCalled();
	});

	it('returns early without decrypting or writing when the message rid does not match', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID });

		await sub.updateMessage(streamMessage({ _id: 'wrong-room', rid: 'different-room' }));

		expect(decryptMessage).not.toHaveBeenCalled();
		expect(await findMessage('wrong-room')).toBeNull();
	});

	it('batches the message, thread and thread_message records under a single write', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID });
		const batchSpy = jest.spyOn(mockActiveDatabase, 'batch');

		await sub.updateMessage(streamMessage({ _id: 'threaded', msg: 'root', tlm: new Date(T1), tmid: 'parent-thread' }));

		// one batch, three prepared records → all committed under the same db.write
		expect(batchSpy).toHaveBeenCalledTimes(1);
		expect(batchSpy.mock.calls[0]).toHaveLength(3);
		expect(await findMessage('threaded')).not.toBeNull();
		expect((await mockActiveDatabase.get('threads').find('threaded')).id).toBe('threaded');
		expect((await mockActiveDatabase.get('thread_messages').find('threaded')).id).toBe('threaded');

		batchSpy.mockRestore();
	});

	it('serializes two concurrent stream events for the same id without a "pending changes" throw', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID });
		await seedMessage(mockActiveDatabase, { id: 'racing', rid: RID, msg: 'v0', updatedAt: new Date(T1) });

		// Both events prepareUpdate the SAME cached record. Pre-fix (reads/prepares outside the
		// writer lock) the second prepareUpdate hits a record with pending changes and throws;
		// the fix serializes read → prepare → batch under one db.write so it can't.
		await withWriterQueueDiagnosticCleared(() =>
			Promise.all([
				sub.updateMessage(streamMessage({ _id: 'racing', msg: 'v1', _updatedAt: new Date(T2) })),
				sub.updateMessage(streamMessage({ _id: 'racing', msg: 'v2', _updatedAt: new Date(T2) }))
			])
		);

		const pendingChangesLogged = mockedLog.mock.calls.some(([error]) =>
			/pending changes|was modified/i.test((error as Error)?.message ?? '')
		);
		expect(pendingChangesLogged).toBe(false);

		// the record survived consistent: one coherent row, both writes applied in order (v2 last)
		const row = await findMessage('racing');
		expect(row?.msg).toBe('v2');
		expect(await messageCount()).toBe(1);
	});
});
