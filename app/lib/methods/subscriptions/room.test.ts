import RoomSubscription from './room';
import { loadMissedMessages } from '../loadMissedMessages';
import { clearUserTyping } from '../../../actions/usersTyping';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import log from '../helpers/log';

const mockSubscribeRoom = jest.fn<Promise<unknown[]>, [string]>(() => Promise.resolve([]));
const mockOnConnectionStatus = jest.fn<() => void, [(status: string) => void]>(() => jest.fn());
const mockOnLogin = jest.fn<() => void, [() => void]>(() => jest.fn());
const mockOnStreamData = jest.fn<Promise<{ stop: jest.Mock }>, [string, (...args: unknown[]) => void]>(() =>
	Promise.resolve({ stop: jest.fn() })
);
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribeRoom: (rid: string) => mockSubscribeRoom(rid),
		onConnectionStatus: (cb: (status: string) => void) => mockOnConnectionStatus(cb),
		onLogin: (cb: () => void) => mockOnLogin(cb),
		onStreamData: (event: string, cb: (...args: unknown[]) => void) => mockOnStreamData(event, cb)
	}
}));

const mockStoreGetState = jest.fn<{ meteor: { connected: boolean } }, []>(() => ({
	meteor: { connected: false }
}));
const mockStoreDispatch = jest.fn<unknown, [unknown]>();
jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => mockStoreGetState(),
		dispatch: (action: unknown) => mockStoreDispatch(action)
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
		decryptMessage: jest.fn((msg: unknown) => Promise.resolve(msg)),
		decryptPendingSubscriptions: jest.fn(),
		decryptPendingMessages: jest.fn(),
		getRoomInstance: jest.fn(),
		stopRoom: jest.fn()
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

		it('wires handleClose through onConnectionStatus, not onStreamData', async () => {
			await sub.subscribe();

			expect(mockOnConnectionStatus).toHaveBeenCalledTimes(1);
			const statusCallback = mockOnConnectionStatus.mock.calls[0][0];

			statusCallback('closed');
			expect(mockStoreDispatch).toHaveBeenCalledWith(clearUserTyping());
		});

		it('wires handleLogin through onLogin, not the pre-auth onConnectionStatus "connected" status', async () => {
			await sub.subscribe();

			expect(mockOnLogin).toHaveBeenCalledWith(sub.handleLogin);

			mockSubscribeRoom.mockClear();
			const statusCallback = mockOnConnectionStatus.mock.calls[0][0];
			statusCallback('connected');
			await Promise.resolve();
			expect(mockSubscribeRoom).not.toHaveBeenCalled();
		});
	});

	describe('handleLogin', () => {
		it('calls subscribeRoom, dispatches clearUserTyping, loads missed messages, and reads', async () => {
			await sub.handleLogin();

			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
			expect(mockStoreDispatch).toHaveBeenCalledWith(clearUserTyping());
			expect(loadMissedMessages).toHaveBeenCalledWith({ rid });
		});

		it('handles subscribeRoom rejection gracefully', async () => {
			mockSubscribeRoom.mockRejectedValueOnce(new Error('boom'));

			await expect(sub.handleLogin()).resolves.toBeUndefined();
		});
	});

	describe('handleClose', () => {
		it('does not call subscribeRoom or loadMissedMessages, but dispatches clearUserTyping', async () => {
			await sub.handleClose();

			expect(mockSubscribeRoom).not.toHaveBeenCalled();
			expect(loadMissedMessages).not.toHaveBeenCalled();
			expect(mockStoreDispatch).toHaveBeenCalledWith(clearUserTyping());
		});
	});

	describe('DDP subscription recovery after forceReopen', () => {
		it('handleLogin re-subscribes the room to restore lost DDP subscriptions', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleLogin();

			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);
			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});

		it('handleClose does NOT re-subscribe (only reconnects restore subscriptions, not disconnects)', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleClose();

			expect(mockSubscribeRoom).not.toHaveBeenCalled();
		});

		it('tears down stale subscriptions on reconnect and tracks fresh ones for later cleanup', async () => {
			const staleSub = { stop: jest.fn() };
			const freshSub = { stop: jest.fn() };
			mockSubscribeRoom.mockResolvedValueOnce([staleSub]).mockResolvedValueOnce([freshSub]);

			await sub.subscribe();
			await sub.handleLogin();
			await sub.unsubscribe();

			expect(staleSub.stop).toHaveBeenCalledTimes(1);
			expect(freshSub.stop).toHaveBeenCalledTimes(1);
		});

		it('does not accumulate subscriptions across repeated handleLogin calls (simulates sequential reopen)', async () => {
			const first = { stop: jest.fn() };
			const second = { stop: jest.fn() };
			mockSubscribeRoom.mockResolvedValueOnce([first]).mockResolvedValueOnce([second]);

			await sub.subscribe();
			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);

			// First reopen → tears down [first], creates [second]
			await sub.handleLogin();
			expect(mockSubscribeRoom).toHaveBeenCalledTimes(2);
			expect(first.stop).toHaveBeenCalledTimes(1);
			expect(second.stop).not.toHaveBeenCalled();

			// Second reopen → tears down [second], creates []
			await sub.handleLogin();
			expect(mockSubscribeRoom).toHaveBeenCalledTimes(3);
			expect(second.stop).toHaveBeenCalledTimes(1);

			// Final cleanup → empty batch, no more unsubscribes
			await sub.unsubscribe();
			expect(first.stop).toHaveBeenCalledTimes(1);
			expect(second.stop).toHaveBeenCalledTimes(1);
		});

		it('does not call onStreamData inside handleLogin (listeners persist across reopen)', async () => {
			await sub.subscribe();
			mockOnStreamData.mockClear();

			await sub.handleLogin();

			expect(mockOnStreamData).not.toHaveBeenCalled();
		});

		it('survives a poisoned subscription array (undefined entry from a rejected sub) and still re-subscribes', async () => {
			// A pre-auth subscribe rejected by the server (nosub) resolves to undefined inside Promise.all.
			const freshSub = { stop: jest.fn() };
			mockSubscribeRoom.mockResolvedValueOnce([undefined as any]).mockResolvedValueOnce([freshSub]);

			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await expect(sub.handleLogin()).resolves.toBeUndefined();
			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);
			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});
	});

	describe('isAlive guard', () => {
		it('handleLogin does nothing once the subscription is no longer alive (race with unsubscribe)', async () => {
			await sub.subscribe();
			await sub.unsubscribe();
			jest.clearAllMocks();

			await sub.handleLogin();

			expect(mockSubscribeRoom).not.toHaveBeenCalled();
			expect(loadMissedMessages).not.toHaveBeenCalled();
			expect(mockStoreDispatch).not.toHaveBeenCalled();
		});

		it('handleLogin re-subscribes while the subscription is still alive', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleLogin();

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

			// updateMessage's promise never resolves on the happy path, so fire both and flush the queues.
			sub.updateMessage({ ...message });
			sub.updateMessage({ ...message });
			await Array.from({ length: 10 }).reduce<Promise<unknown>>(
				chain => chain.then(() => new Promise(resolve => setImmediate(resolve))),
				Promise.resolve()
			);

			const loggedPendingChanges = (log as jest.Mock).mock.calls.some(([err]) => /pending changes/.test(err?.message));
			expect(loggedPendingChanges).toBe(false);
		});
	});
});
