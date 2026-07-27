import RoomSubscription from './room';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import log from '../helpers/log';

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
	let writerQueue: Promise<unknown> = Promise.resolve();
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
				write: jest.fn((callback: () => Promise<void>) => {
					const run = writerQueue.then(() => callback());
					writerQueue = run.catch(() => undefined);
					return run;
				}),
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
		const makeRecord = (debugName: string) => ({
			_preparedState: null as string | null,
			prepareUpdate(recordUpdater: (m: any) => void) {
				if (this._preparedState) {
					throw new Error(`Cannot update a record with pending changes (${debugName})`);
				}
				recordUpdater(this);
				this._preparedState = 'update';
				return this;
			}
		});

		it('does not throw "pending changes" when two stream events for the same message id arrive concurrently', async () => {
			const _id = 'KXse45i7gGYE8j4Xb';
			const messageRecord = makeRecord(`messages#${_id}`);
			const threadRecord = makeRecord(`threads#${_id}`);
			(getMessageById as jest.Mock).mockResolvedValue(messageRecord);
			(getThreadById as jest.Mock).mockResolvedValue(threadRecord);
			// db.batch commits prepared records, clearing their pending state (like the real writer).
			mockDbBatch.mockImplementation((...items: any[]) => {
				items.forEach(item => {
					if (item && typeof item === 'object' && '_preparedState' in item) {
						item._preparedState = null;
					}
				});
				return Promise.resolve(undefined);
			});

			const message = { _id, rid, tlm: { $date: 1 } } as any;

			await Promise.all([sub.updateMessage({ ...message }), sub.updateMessage({ ...message })]);

			const loggedPendingChanges = (log as jest.Mock).mock.calls.some(([err]) => /pending changes/.test(err?.message));
			expect(loggedPendingChanges).toBe(false);
		});
	});
});
