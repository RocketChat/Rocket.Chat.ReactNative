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
	default: { active: { get: jest.fn(), write: jest.fn() } }
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
jest.mock('../../encryption', () => ({ Encryption: { decryptMessage: jest.fn(m => m) } }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';

const missedMessage = {
	_id: 'missed-1',
	rid: RID,
	msg: 'sent while the app was backgrounded',
	ts: new Date(Date.UTC(2024, 0, 1, 12, 0, 0)).toISOString(),
	u: { _id: 'user2', username: 'user2' }
};

const syncMessagesResponse = (
	updated: unknown[]
): { result: { updated: unknown[]; deleted: unknown[]; cursor: { next: number | null } } } => ({
	result: { updated, deleted: [], cursor: { next: null } }
});

describe('RoomSubscription resume sync', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		mockedSdkGet.mockResolvedValue(syncMessagesResponse([missedMessage]) as never);
	});

	it('fetches and persists messages missed while backgrounded when the room has a sync cursor', async () => {
		const persistedCursor = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: persistedCursor } as never);

		await new RoomSubscription(RID).fetchMissedMessages(() => false);

		expect(mockedSdkGet).toHaveBeenCalledWith(
			'chat.syncMessages',
			expect.objectContaining({ roomId: RID, type: 'UPDATED', next: persistedCursor.getTime() })
		);
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: expect.arrayContaining([expect.objectContaining({ _id: 'missed-1' })])
			})
		);
	});

	it('fetches nothing for a room without a sync cursor (null lastOpen): RoomView owns the initial load', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);

		await new RoomSubscription(RID).fetchMissedMessages(() => false);

		expect(mockedSdkGet).not.toHaveBeenCalled();
	});

	it('writes nothing to the subscription when the room is closed', async () => {
		const subscriptionUpdate = jest.fn();
		mockedGetSubscriptionByRoomId.mockResolvedValue({
			lastOpen: new Date(Date.UTC(2024, 0, 1, 11, 0, 0)),
			update: subscriptionUpdate
		} as never);

		await new RoomSubscription(RID).unsubscribe();

		expect(subscriptionUpdate).not.toHaveBeenCalled();
	});
});
