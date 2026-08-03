import RoomSubscription from './room';
import sdk from '../../services/sdk';
import updateMessages from '../updateMessages';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn((cb: () => Promise<void>) => cb()) } }
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' }, settings: {}, login: { user: {} }, room: {} })),
		dispatch: jest.fn()
	}
}));

jest.mock('../updateMessages', () => jest.fn());
jest.mock('../readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));
jest.mock('../../encryption', () => ({ Encryption: { decryptMessage: jest.fn(m => m) } }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';

/** Server clock. The cursor the client legitimately reached by actually fetching. */
const FETCHED_UP_TO = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
/** Server clock. Message written while the client was offline — never delivered to the device. */
const MISSED_SERVER_UPDATED_AT = new Date(Date.UTC(2024, 0, 1, 11, 30, 0));
/** Device clock while the room is closed: ahead of the newest message the client actually holds. */
const DEVICE_NOW = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));

const missedMessage = {
	_id: 'missed-1',
	rid: RID,
	msg: 'sent while the device was offline',
	ts: MISSED_SERVER_UPDATED_AT.toISOString(),
	_updatedAt: MISSED_SERVER_UPDATED_AT.toISOString(),
	u: { _id: 'user2', username: 'user2' }
};

/** Stands in for the persisted subscription row; `lastOpen` is the sync cursor. */
const makeSubscription = (lastOpen: Date | null) => {
	const subscription = {
		t: 'c',
		lastOpen,
		update: (updater: (s: { lastOpen: Date | null }) => void) => {
			updater(subscription);
			return Promise.resolve();
		}
	};
	return subscription;
};

/** Server behaviour of chat.syncMessages: only returns messages at or after the requested cursor. */
const respondFromServer = () =>
	mockedSdkGet.mockImplementation(((_endpoint: string, params: { next?: number; type?: string }) =>
		Promise.resolve({
			result: {
				updated:
					params.type === 'UPDATED' && typeof params.next === 'number' && MISSED_SERVER_UPDATED_AT.getTime() >= params.next
						? [missedMessage]
						: [],
				deleted: [],
				cursor: { next: null }
			}
		})) as never);

describe('closing a room while offline must not advance the sync cursor', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
		jest.setSystemTime(DEVICE_NOW);
		mockedUpdateMessages.mockResolvedValue(0);
		respondFromServer();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('leaves the cursor at what was actually fetched when the room is closed without fetching', async () => {
		const subscription = makeSubscription(FETCHED_UP_TO);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await new RoomSubscription(RID).unsubscribe();
		await Promise.resolve();

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(subscription.lastOpen).toEqual(FETCHED_UP_TO);
	});

	it('still delivers a message written while offline after the room was closed and reopened', async () => {
		const subscription = makeSubscription(FETCHED_UP_TO);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await new RoomSubscription(RID).unsubscribe();
		await Promise.resolve();

		await new RoomSubscription(RID).handleConnection();

		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: expect.arrayContaining([expect.objectContaining({ _id: 'missed-1' })])
			})
		);
	});
});
