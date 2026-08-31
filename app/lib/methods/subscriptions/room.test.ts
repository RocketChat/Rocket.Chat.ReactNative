import { InteractionManager } from 'react-native';

import RoomSubscription from './room';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import database from '../../database';
import log from '../helpers/log';
import {
	commitPreparedRecords,
	deferred,
	flush,
	loggedPendingChanges,
	makeFakeRecord
} from '../../database/__tests__/mockedWatermelonDB';

const mockSubscribeRoom = jest.fn<Promise<unknown[]>, [string]>(() => Promise.resolve([]));
const mockOnStreamData = jest.fn<Promise<{ stop: jest.Mock }>, [string, (...args: unknown[]) => void]>(() =>
	Promise.resolve({ stop: jest.fn() })
);
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribeRoom: (rid: string) => mockSubscribeRoom(rid),
		onStreamData: (event: string, cb: (...args: unknown[]) => void) => mockOnStreamData(event, cb)
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({})),
		dispatch: jest.fn()
	}
}));

jest.mock('../loadMissedMessages', () => ({
	loadMissedMessages: jest.fn<Promise<void>, [unknown]>(() => Promise.resolve())
}));

jest.mock('../readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../helpers', () => ({
	debounce: (fn: (...args: unknown[]) => unknown) => fn,
	compareServerVersion: jest.fn()
}));

jest.mock('../helpers/protectedFunction', () => ({
	__esModule: true,
	default: (fn: (...args: unknown[]) => unknown) => fn
}));

jest.mock('../helpers/buildMessage', () => ({
	__esModule: true,
	default: (msg: unknown) => msg
}));

jest.mock('../helpers/markMessagesRead', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../updateLastOpen', () => ({
	updateLastOpen: jest.fn()
}));

jest.mock('../../../actions/usersTyping', () => ({
	addUserTyping: jest.fn(),
	clearUserTyping: jest.fn().mockReturnValue({ type: 'CLEAR_USER_TYPING' }),
	removeUserTyping: jest.fn()
}));

jest.mock('../../../actions/room', () => ({
	subscribeRoom: jest.fn().mockReturnValue({ type: 'SUBSCRIBE_ROOM' }),
	unsubscribeRoom: jest.fn().mockReturnValue({ type: 'UNSUBSCRIBE_ROOM' })
}));

jest.mock('../../encryption', () => ({
	Encryption: {
		decryptMessage: jest.fn((msg: unknown) => Promise.resolve(msg))
	}
}));

const mockDbBatch = jest.fn().mockResolvedValue(undefined);
const mockDbGet = jest.fn();
jest.mock('../../database', () => {
	const { createWriterLock } = require('../../database/__tests__/mockedWatermelonDB');
	const write = createWriterLock();
	const mockModel = {
		prepareCreate: jest.fn(() => ({})),
		prepareUpdate: jest.fn(() => ({})),
		prepareDestroyPermanently: jest.fn(() => ({})),
		schema: {}
	};
	return {
		__esModule: true,
		default: {
			active: {
				get: (...args: unknown[]) => mockDbGet(...args) ?? mockModel,
				write: jest.fn(write),
				batch: (...args: unknown[]) => mockDbBatch(...args)
			}
		}
	};
});

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

describe('RoomSubscription', () => {
	const rid = 'test-room-id';
	let sub: RoomSubscription;

	beforeEach(() => {
		jest.clearAllMocks();
		mockSubscribeRoom.mockResolvedValue([]);
		sub = new RoomSubscription(rid);
	});

	afterEach(() => {
		mockSubscribeRoom.mockReset();
	});

	describe('subscribe', () => {
		it('calls subscribeRoom exactly once on initial entry (no duplicate from connected listener)', async () => {
			await sub.subscribe();

			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);
			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});
	});

	describe('updateMessage concurrency', () => {
		it('does not throw "pending changes" when two stream events for the same message id arrive concurrently', async () => {
			const _id = 'KXse45i7gGYE8j4Xb';
			const messageRecord = makeFakeRecord(`messages#${_id}`);
			const threadRecord = makeFakeRecord(`threads#${_id}`);
			(getMessageById as jest.Mock).mockResolvedValue(messageRecord);
			(getThreadById as jest.Mock).mockResolvedValue(threadRecord);
			mockDbBatch.mockImplementation(commitPreparedRecords);

			const message = { _id, rid, tlm: { $date: 1 } } as any;

			await Promise.all([sub.updateMessage({ ...message }), sub.updateMessage({ ...message })]);

			expect(loggedPendingChanges(log)).toBe(false);
		});
	});

	describe('deleteMessage concurrency', () => {
		let interactionTask: Promise<unknown> | null = null;

		beforeEach(() => {
			interactionTask = null;
			// Run the deferred work inline so the test can await it.
			jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
				interactionTask = task();
				return { then: () => undefined, done: () => undefined, cancel: () => undefined } as any;
			});
			mockDbBatch.mockImplementation(commitPreparedRecords);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('does not throw "pending changes" when a concurrent writer touches a message being deleted', async () => {
			const _id = 'KXse45i7gGYE8j4Xb';
			const messageRecord = makeFakeRecord(`messages#${_id}`);
			const threadRecord = makeFakeRecord(`threads#${_id}`);
			const threadMessageRecord = makeFakeRecord(`thread_messages#${_id}`);
			const collections: Record<string, unknown> = {
				messages: { find: () => Promise.resolve(messageRecord) },
				threads: { find: () => Promise.resolve(threadRecord) },
				thread_messages: { find: () => Promise.resolve(threadMessageRecord) }
			};
			mockDbGet.mockImplementation((name: string) => collections[name]);

			const db = (database as any).active;

			// Hold the writer lock — as an incoming message update would — and then touch the very
			// record the delete branch is about to prepare for destruction.
			const concurrentGate = deferred();
			const concurrentWrite = db.write(async () => {
				await concurrentGate.promise;
				await db.batch([
					messageRecord.prepareUpdate((m: any) => {
						m.msg = 'written by another writer';
					})
				]);
			});

			await sub.handleNotifyRoomReceived({
				fields: { eventName: `${rid}/deleteMessage`, args: [{ _id }] }
			} as any);

			// Give an unlocked implementation the chance to prepare now — before the concurrent
			// writer runs — and hold the records pending until its own batch.
			await flush();
			concurrentGate.resolve();

			await expect(Promise.all([concurrentWrite, interactionTask])).resolves.toBeDefined();

			expect(loggedPendingChanges(log)).toBe(false);

			// The whole delete batch committed together and nothing was left prepared.
			const deleteBatch = mockDbBatch.mock.calls
				.map(call => call.flat())
				.find(items => items.includes(threadRecord) && items.includes(threadMessageRecord));
			expect(deleteBatch).toContain(messageRecord);
			expect(messageRecord._preparedState).toBeNull();
			expect(threadRecord._preparedState).toBeNull();
			expect(threadMessageRecord._preparedState).toBeNull();
		});
	});
});
