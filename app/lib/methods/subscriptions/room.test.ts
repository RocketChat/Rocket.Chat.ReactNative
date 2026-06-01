/* eslint-disable import/first */
jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn((raw: any) => raw)
}));

jest.mock('@nozbe/watermelondb', () => ({
	Q: {
		where: jest.fn(),
		gt: jest.fn(),
		lt: jest.fn(),
		gte: jest.fn(),
		lte: jest.fn(),
		or: jest.fn(),
		like: jest.fn(),
		oneOf: jest.fn()
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		current: undefined,
		subscribeRoom: jest.fn(),
		onStreamData: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => ({
				find: jest.fn().mockResolvedValue(null),
				query: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue([]) })),
				prepareCreate: jest.fn()
			})),
			write: jest.fn((fn: any) => Promise.resolve(fn())),
			batch: jest.fn()
		}
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			login: { user: { id: 'u1', username: 'testuser', name: 'Test User' } },
			settings: { UI_Use_Real_Name: false },
			room: { subscribedRoom: 'ROOM_001' }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../helpers/protectedFunction', () => ({
	__esModule: true,
	default: (fn: any) => fn
}));

jest.mock('../helpers/buildMessage', () => ({
	__esModule: true,
	default: (msg: any) => msg
}));

jest.mock('../helpers', () => ({
	debounce: (_fn: any, _ms: number) => _fn
}));

jest.mock('../../encryption', () => ({
	Encryption: {
		decryptMessage: jest.fn().mockImplementation((m: any) => Promise.resolve(m))
	}
}));

jest.mock('../loadMissedMessages', () => ({
	loadMissedMessages: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../readMessages', () => ({
	readMessages: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../updateLastOpen', () => ({
	updateLastOpen: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../helpers/markMessagesRead', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../database/services/Thread', () => ({
	getThreadById: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../../actions/usersTyping', () => ({
	addUserTyping: jest.fn((name: string) => ({ type: 'USERS_TYPING_ADD', username: name })),
	removeUserTyping: jest.fn((name: string) => ({ type: 'USERS_TYPING_REMOVE', username: name })),
	clearUserTyping: jest.fn(() => ({ type: 'USERS_TYPING_CLEAR' }))
}));

jest.mock('../../../actions/room', () => ({
	subscribeRoom: jest.fn((rid: string) => ({ type: 'ROOM_SUBSCRIBE', rid })),
	unsubscribeRoom: jest.fn((rid: string) => ({ type: 'ROOM_UNSUBSCRIBE', rid }))
}));

jest.mock('react-native', () => ({
	InteractionManager: {
		runAfterInteractions: jest.fn((fn: () => void) => fn())
	}
}));

jest.mock('ejson', () => ({
	fromJSONValue: jest.fn((v: any) => v)
}));

import RoomSubscription from './room';
import sdk from '../../services/sdk';
import { store as reduxStore } from '../../store/auxStore';
import { addUserTyping, removeUserTyping, clearUserTyping } from '../../../actions/usersTyping';
import { subscribeRoom, unsubscribeRoom } from '../../../actions/room';
import database from '../../database';

const TEST_RID = 'ROOM_001';

describe('RoomSubscription', () => {
	let stopMock: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		stopMock = jest.fn();
		(sdk.subscribeRoom as jest.Mock).mockResolvedValue([{ unsubscribe: jest.fn() }]);
		(sdk.onStreamData as jest.Mock).mockResolvedValue({ stop: stopMock });
		(reduxStore.getState as jest.Mock).mockReturnValue({
			login: { user: { id: 'u1', username: 'testuser', name: 'Test User' } },
			settings: { UI_Use_Real_Name: false },
			room: { subscribedRoom: TEST_RID }
		});
	});

	describe('subscribe()', () => {
		it('calls sdk.subscribeRoom with the correct rid', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			expect(sdk.subscribeRoom).toHaveBeenCalledWith(TEST_RID);
		});

		it('registers stream-notify-room listener via sdk.onStreamData', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			expect(sdk.onStreamData).toHaveBeenCalledWith('stream-notify-room', expect.any(Function));
		});

		it('registers stream-room-messages listener via sdk.onStreamData', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			expect(sdk.onStreamData).toHaveBeenCalledWith('stream-room-messages', expect.any(Function));
		});

		it('dispatches subscribeRoom action with the correct rid', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			expect(subscribeRoom).toHaveBeenCalledWith(TEST_RID);
			expect(reduxStore.dispatch).toHaveBeenCalledWith(expect.objectContaining({ rid: TEST_RID }));
		});

		it('isAlive flag prevents double-subscribe side-effects when already unsubscribed', async () => {
			const sub = new RoomSubscription(TEST_RID);
			// Mark as dead before subscribing
			(sub as any).isAlive = false;
			await sub.subscribe();
			// unsubscribe should have been called automatically due to isAlive=false
			expect(unsubscribeRoom).toHaveBeenCalledWith(TEST_RID);
		});
	});

	describe('unsubscribe()', () => {
		it('calls stop() on all registered stream listeners', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await sub.unsubscribe();
			// 4 listeners registered (connected, close, stream-notify-room, stream-room-messages)
			expect(stopMock).toHaveBeenCalled();
		});

		it('dispatches unsubscribeRoom and clearUserTyping actions', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			(reduxStore.dispatch as jest.Mock).mockClear();
			await sub.unsubscribe();
			expect(unsubscribeRoom).toHaveBeenCalledWith(TEST_RID);
			expect(clearUserTyping).toHaveBeenCalled();
		});

		it('sets isAlive to false', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await sub.unsubscribe();
			expect((sub as any).isAlive).toBe(false);
		});
	});

	describe('handleNotifyRoomReceived — typing event', () => {
		let capturedRoomHandler: (msg: any) => Promise<void>;

		beforeEach(async () => {
			(sdk.onStreamData as jest.Mock).mockImplementation((name: string, handler: any) => {
				if (name === 'stream-notify-room') capturedRoomHandler = handler;
				return Promise.resolve({ stop: stopMock });
			});
		});

		it('dispatches addUserTyping when another user starts typing', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/typing`,
					args: ['otheruser', true]
				}
			});
			expect(addUserTyping).toHaveBeenCalledWith('otheruser');
			expect(reduxStore.dispatch).toHaveBeenCalledWith(expect.objectContaining({ username: 'otheruser' }));
		});

		it('dispatches removeUserTyping when another user stops typing', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/typing`,
					args: ['otheruser', false]
				}
			});
			expect(removeUserTyping).toHaveBeenCalledWith('otheruser');
		});

		it('does not dispatch typing for the current user', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			(reduxStore.dispatch as jest.Mock).mockClear();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/typing`,
					args: ['testuser', true]
				}
			});
			expect(addUserTyping).not.toHaveBeenCalled();
		});

		it('ignores typing events for a different room', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			(reduxStore.dispatch as jest.Mock).mockClear();
			await capturedRoomHandler({
				fields: {
					eventName: 'OTHER_ROOM/typing',
					args: ['otheruser', true]
				}
			});
			expect(addUserTyping).not.toHaveBeenCalled();
		});
	});

	describe('handleNotifyRoomReceived — user-activity event', () => {
		let capturedRoomHandler: (msg: any) => Promise<void>;

		beforeEach(async () => {
			(sdk.onStreamData as jest.Mock).mockImplementation((name: string, handler: any) => {
				if (name === 'stream-notify-room') capturedRoomHandler = handler;
				return Promise.resolve({ stop: stopMock });
			});
		});

		it('dispatches addUserTyping when user-activity includes user-typing', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/user-activity`,
					args: ['otheruser', ['user-typing']]
				}
			});
			expect(addUserTyping).toHaveBeenCalledWith('otheruser');
		});

		it('dispatches removeUserTyping when user-activity has empty activities', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/user-activity`,
					args: ['otheruser', []]
				}
			});
			expect(removeUserTyping).toHaveBeenCalledWith('otheruser');
		});
	});

	describe('handleNotifyRoomReceived — deleteMessage event', () => {
		let capturedRoomHandler: (msg: any) => Promise<void>;
		let mockFind: jest.Mock;
		let mockWrite: jest.Mock;
		let mockBatch: jest.Mock;

		beforeEach(async () => {
			mockFind = jest.fn().mockRejectedValue(new Error('not found'));
			mockWrite = jest.fn((fn: any) => Promise.resolve(fn()));
			mockBatch = jest.fn().mockResolvedValue(undefined);

			(database.active.get as jest.Mock).mockReturnValue({
				find: mockFind
			});
			(database.active.write as jest.Mock).mockImplementation(mockWrite);
			(database.active.batch as jest.Mock).mockImplementation(mockBatch);

			(sdk.onStreamData as jest.Mock).mockImplementation((name: string, handler: any) => {
				if (name === 'stream-notify-room') capturedRoomHandler = handler;
				return Promise.resolve({ stop: stopMock });
			});
		});

		it('attempts to find and delete message, thread, and thread message from DB', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await sub.subscribe();
			await capturedRoomHandler({
				fields: {
					eventName: `${TEST_RID}/deleteMessage`,
					args: [{ _id: 'msg-to-delete' }]
				}
			});
			// find is called for messages, threads, and thread_messages
			expect(mockFind).toHaveBeenCalledWith('msg-to-delete');
		});
	});

	describe('removeListener()', () => {
		it('calls stop() on a resolved promise listener', async () => {
			const sub = new RoomSubscription(TEST_RID);
			const innerStop = jest.fn();
			const promise = Promise.resolve({ stop: innerStop });
			await (sub as any).removeListener(promise);
			expect(innerStop).toHaveBeenCalled();
		});

		it('does nothing when promise is undefined', async () => {
			const sub = new RoomSubscription(TEST_RID);
			await expect((sub as any).removeListener(undefined)).resolves.toBeUndefined();
		});
	});
});
