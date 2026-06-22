import RoomSubscription from './room';
import { loadMissedMessages } from '../loadMissedMessages';
import { clearUserTyping } from '../../../actions/usersTyping';

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
				write: jest.fn((callback: () => Promise<void>) => callback()),
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
		sub = new RoomSubscription(rid);
	});

	describe('subscribe', () => {
		it('calls subscribeRoom exactly once on initial entry (no duplicate from connected listener)', async () => {
			await sub.subscribe();

			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);
			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});
	});

	describe('handleConnected', () => {
		it('calls subscribeRoom, dispatches clearUserTyping, loads missed messages, and reads', async () => {
			await sub.handleConnected();

			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
			expect(mockStoreDispatch).toHaveBeenCalledWith(clearUserTyping());
			expect(loadMissedMessages).toHaveBeenCalledWith({ rid });
		});

		it('handles subscribeRoom rejection gracefully', async () => {
			mockSubscribeRoom.mockRejectedValueOnce(new Error('boom'));

			await expect(sub.handleConnected()).resolves.toBeUndefined();
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
		it('handleConnected re-subscribes the room to restore lost DDP subscriptions', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleConnected();

			expect(mockSubscribeRoom).toHaveBeenCalledTimes(1);
			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});

		it('handleClose does NOT re-subscribe (only reconnects restore subscriptions, not disconnects)', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleClose();

			expect(mockSubscribeRoom).not.toHaveBeenCalled();
		});

		it('tracks the re-subscribed promise so unsubscribe tears down the fresh subscriptions, not the stale ones', async () => {
			const staleSub = { unsubscribe: jest.fn(() => Promise.resolve()) };
			const freshSub = { unsubscribe: jest.fn(() => Promise.resolve()) };
			mockSubscribeRoom.mockResolvedValueOnce([staleSub]).mockResolvedValueOnce([freshSub]);

			await sub.subscribe();
			await sub.handleConnected();
			await sub.unsubscribe();

			expect(freshSub.unsubscribe).toHaveBeenCalledTimes(1);
			expect(staleSub.unsubscribe).not.toHaveBeenCalled();
		});
	});

	describe('isAlive guard', () => {
		it('handleConnected does nothing once the subscription is no longer alive (race with unsubscribe)', async () => {
			await sub.subscribe();
			await sub.unsubscribe();
			jest.clearAllMocks();

			await sub.handleConnected();

			expect(mockSubscribeRoom).not.toHaveBeenCalled();
			expect(loadMissedMessages).not.toHaveBeenCalled();
			expect(mockStoreDispatch).not.toHaveBeenCalled();
		});

		it('handleConnected re-subscribes while the subscription is still alive', async () => {
			await sub.subscribe();
			mockSubscribeRoom.mockClear();

			await sub.handleConnected();

			expect(mockSubscribeRoom).toHaveBeenCalledWith(rid);
		});
	});
});
