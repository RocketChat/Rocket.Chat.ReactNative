import EJSON from 'ejson';

import RoomSubscription from './room';
import sdk from '../../services/sdk';
import updateMessages from '../updateMessages';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		subscribeRoom: jest.fn(),
		onStreamData: jest.fn(),
		getSubscriptionById: jest.fn()
	}
}));

const batched: any[] = [];
const messagesCollection = {
	schema: { columns: {}, columnArray: [] },
	prepareCreate: (build: (record: any) => void) => {
		const record: any = {};
		build(record);
		return record;
	}
};

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => messagesCollection),
			write: jest.fn((work: () => Promise<void>) => work()),
			batch: jest.fn((...records: any[]) => {
				batched.push(...records.filter(Boolean));
			})
		}
	}
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../database/services/Message', () => ({ getMessageById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../database/services/Thread', () => ({ getThreadById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../database/services/ThreadMessage', () => ({ getThreadMessageById: jest.fn(() => Promise.resolve(null)) }));

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
const mockedSubscribeRoom = sdk.subscribeRoom as jest.Mock;
const mockedOnStreamData = sdk.onStreamData as jest.Mock;
const mockedGetSubscriptionById = sdk.getSubscriptionById as jest.Mock;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';
const MESSAGES_STREAM_ID = 'stream-room-messages-id';
const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));

/** Sent while the socket was down: only the catch-up fetch can bring it in. */
const offlineMessage = {
	_id: 'offline-1',
	rid: RID,
	msg: 'sent while the socket was down',
	ts: new Date(Date.UTC(2024, 0, 1, 11, 30, 0)).toISOString(),
	_updatedAt: new Date(Date.UTC(2024, 0, 1, 11, 30, 0)).toISOString(),
	u: { _id: 'user2', username: 'user2' }
};

/** Accepted by the server between the socket opening and the stream being acked — the lost window. */
const windowMessage = {
	_id: 'window-1',
	rid: RID,
	msg: 'sent while the room stream was still subscribing',
	ts: new Date(Date.UTC(2024, 0, 1, 11, 59, 0)).toISOString(),
	_updatedAt: new Date(Date.UTC(2024, 0, 1, 11, 59, 0)).toISOString(),
	u: { _id: 'user2', username: 'user2' }
};

/** Delivered by the live stream once it is acked. */
const streamedMessage = {
	_id: 'streamed-1',
	rid: RID,
	msg: 'sent after the room stream was acked',
	ts: { $date: Date.UTC(2024, 0, 1, 12, 0, 0) },
	u: { _id: 'user2', username: 'user2' }
};

const streamSubscriptions = () => [
	{ id: MESSAGES_STREAM_ID, name: 'stream-room-messages', params: [RID], unsubscribe: jest.fn(() => Promise.resolve()) }
];

describe('RoomSubscription reconnect catch-up fetch', () => {
	/** Listeners registered by the subscription, keyed by the DDP event they listen to. */
	let listeners: Record<string, (message: any) => void>;

	/** The socket dropping and reopening, up to the DDP handshake — all before the stream ack. */
	const reconnectSocket = () => {
		listeners.close?.({});
		listeners.connected?.({});
	};

	const ackRoomStream = () => listeners.ready({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });

	const flush = () => new Promise(resolve => setImmediate(resolve));

	/** One fetch issues an UPDATED and a DELETED request; the UPDATED ones count the fetches. */
	const fetchCount = () =>
		mockedSdkGet.mock.calls.filter(([endpoint, params]: any[]) => endpoint === 'chat.syncMessages' && params?.type === 'UPDATED')
			.length;

	beforeEach(() => {
		jest.clearAllMocks();
		batched.length = 0;
		listeners = {};
		mockedOnStreamData.mockImplementation((event: string, callback: (message: any) => void) => {
			listeners[event] = callback;
			return Promise.resolve({ stop: jest.fn() });
		});
		mockedSubscribeRoom.mockResolvedValue(streamSubscriptions());
		mockedGetSubscriptionById.mockImplementation((id: string) => streamSubscriptions().find(sub => sub.id === id));
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR } as never);
		mockedSdkGet.mockResolvedValue({
			result: { updated: [offlineMessage, windowMessage], deleted: [], cursor: { next: null } }
		} as never);
	});

	const openRoom = async () => {
		const subscription = new RoomSubscription(RID);
		await subscription.subscribe();
		await flush();
		// opening the room acks the stream too; RoomView owns that load, so nothing is fetched here
		mockedSdkGet.mockClear();
		mockedUpdateMessages.mockClear();
		return subscription;
	};

	it('does not fetch while the room stream is still subscribing', async () => {
		await openRoom();

		reconnectSocket();
		await flush();

		expect(mockedSdkGet).not.toHaveBeenCalled();
	});

	it('fetches once the room stream is acked', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();

		expect(mockedSdkGet).toHaveBeenCalledWith(
			'chat.syncMessages',
			expect.objectContaining({ roomId: RID, type: 'UPDATED', next: CURSOR.getTime() })
		);
	});

	it('persists a message set straddling the reconnect window', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();
		await listeners['stream-room-messages']({ fields: { args: [EJSON.toJSONValue(streamedMessage)] } });

		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: expect.arrayContaining([
					expect.objectContaining({ _id: offlineMessage._id }),
					expect.objectContaining({ _id: windowMessage._id })
				])
			})
		);
		expect(batched).toEqual(expect.arrayContaining([expect.objectContaining({ _id: streamedMessage._id })]));
	});

	it('does not fetch when the room is opened on a healthy socket', async () => {
		const subscription = new RoomSubscription(RID);
		await subscription.subscribe();
		await flush();
		ackRoomStream();
		await flush();

		expect(mockedSdkGet).not.toHaveBeenCalled();
	});

	it('fetches nothing for a room without a sync cursor: RoomView owns the initial load', async () => {
		await openRoom();
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: null, t: 'c' } as never);

		reconnectSocket();
		ackRoomStream();
		await flush();

		expect(mockedSdkGet).not.toHaveBeenCalled();
	});

	it('retries on the next ack when the fetch fails', async () => {
		await openRoom();
		mockedSdkGet.mockRejectedValueOnce(new Error('socket closed mid-fetch'));

		reconnectSocket();
		ackRoomStream();
		await flush();
		ackRoomStream();
		await flush();

		expect(fetchCount()).toBe(2);
	});

	it('fetches after a socket reopen that emits no close', async () => {
		await openRoom();

		listeners.connected({});
		ackRoomStream();
		await flush();

		expect(fetchCount()).toBe(1);
	});

	it('does not fetch again on an ack with no reconnect in between', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();
		ackRoomStream();
		await flush();

		expect(fetchCount()).toBe(1);
	});

	it('does not fetch after the room is left', async () => {
		const subscription = await openRoom();
		reconnectSocket();
		await subscription.unsubscribe();

		ackRoomStream();
		await flush();

		expect(mockedSdkGet).not.toHaveBeenCalled();
	});
});
