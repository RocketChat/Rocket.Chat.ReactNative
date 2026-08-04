import RoomSubscription from './room';
import { loadMissedMessages } from '../loadMissedMessages';

/**
 * `connected` fires on the DDP handshake — the same event that dispatches the resume
 * login. The room's streams are only re-sent by `subscribeAll()` once that login lands,
 * so a refetch that runs at handshake time leaves the interval between it and the new
 * subscription covered by nothing: too late for the fetch, too early for the stream.
 *
 * These drive the real `waitForLoginReady` against a controllable store, so they test
 * the ordering rather than a mock of it.
 */

let mockState: {
	login: { isAuthenticated: boolean; user: Record<string, unknown> };
	meteor: { connected: boolean };
	server: { version: string };
	settings: Record<string, unknown>;
	room: Record<string, unknown>;
};
const mockListeners: Array<() => void> = [];

const setState = (next: Partial<typeof mockState>) => {
	mockState = { ...mockState, ...next } as typeof mockState;
	mockListeners.forEach(listener => listener());
};

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => mockState,
		dispatch: jest.fn(),
		subscribe: (listener: () => void) => {
			mockListeners.push(listener);
			return () => {
				const index = mockListeners.indexOf(listener);
				if (index >= 0) mockListeners.splice(index, 1);
			};
		}
	}
}));

jest.mock('../loadMissedMessages', () => ({ loadMissedMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../services/sdk', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../database', () => ({ __esModule: true, default: { active: { get: jest.fn(), write: jest.fn() } } }));
jest.mock('../../database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));
jest.mock('../../database/services/Message', () => ({ getMessageById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../updateMessages', () => jest.fn());
jest.mock('../../encryption', () => ({ Encryption: { decryptMessage: jest.fn(m => m), stopRoom: jest.fn() } }));

const mockedLoadMissedMessages = loadMissedMessages as jest.MockedFunction<typeof loadMissedMessages>;

const RID = 'ROOM_ID';

/** Let pending promise callbacks run without advancing the clock. */
const flush = async () => {
	for (let i = 0; i < 10; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

describe('RoomSubscription connection recovery ordering', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockListeners.length = 0;
		// The state right after a reopen: the handshake landed (`connected`) and the resume
		// login was dispatched, so LOGIN.REQUEST has cleared `isAuthenticated`.
		mockState = {
			login: { isAuthenticated: false, user: {} },
			meteor: { connected: true },
			server: { version: '7.4.0' },
			settings: {},
			room: {}
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('does not refetch until the resume login lands, so the stream is re-subscribed first', async () => {
		const recovery = new RoomSubscription(RID).handleConnection();
		await flush();

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();

		// LOGIN.SUCCESS — by now `Socket.login()` has re-sent this room's subscriptions.
		setState({ login: { isAuthenticated: true, user: {} } });
		await flush();
		await recovery;

		expect(mockedLoadMissedMessages).toHaveBeenCalledWith({ rid: RID });
	});

	it('still refetches when the login never lands, so a broken socket is no worse off', async () => {
		const recovery = new RoomSubscription(RID).handleConnection();
		await jest.advanceTimersByTimeAsync(10000);
		await recovery;

		expect(mockedLoadMissedMessages).toHaveBeenCalledWith({ rid: RID });
	});

	it('skips the refetch when the room was left while waiting for the login', async () => {
		const subscription = new RoomSubscription(RID);
		const recovery = subscription.handleConnection();
		await flush();

		await subscription.unsubscribe();
		setState({ login: { isAuthenticated: true, user: {} } });
		await flush();
		await recovery;

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
	});
});
