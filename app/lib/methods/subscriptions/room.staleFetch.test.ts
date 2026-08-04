import RoomSubscription from './room';
import sdk from '../../services/sdk';
import updateMessages from '../updateMessages';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { updateLastOpen } from '../updateLastOpen';
import { readMessages } from '../readMessages';

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		subscribeRoom: jest.fn(),
		onStreamData: jest.fn(),
		getSubscriptionById: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => ({ schema: { columns: {}, columnArray: [] }, prepareCreate: jest.fn() })),
			write: jest.fn((work: () => Promise<void>) => work()),
			batch: jest.fn()
		}
	}
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' }, settings: {}, login: { user: {} }, room: {} })),
		dispatch: jest.fn()
	}
}));

jest.mock('../updateMessages', () => jest.fn());
jest.mock('../updateLastOpen', () => ({
	updateLastOpen: jest.fn(),
	snapshotServerTimestamps: jest.requireActual('../updateLastOpen').snapshotServerTimestamps
}));
jest.mock('../readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../encryption', () => ({ Encryption: { decryptMessage: jest.fn(m => m) } }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedSubscribeRoom = sdk.subscribeRoom as jest.Mock;
const mockedOnStreamData = sdk.onStreamData as jest.Mock;
const mockedGetSubscriptionById = sdk.getSubscriptionById as jest.Mock;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedUpdateLastOpen = updateLastOpen as jest.MockedFunction<typeof updateLastOpen>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';
const MESSAGES_STREAM_ID = 'stream-room-messages-id';
const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));

const message = (id: string, minute: number) => ({
	_id: id,
	rid: RID,
	msg: id,
	ts: new Date(Date.UTC(2024, 0, 1, 11, minute, 0)).toISOString(),
	_updatedAt: new Date(Date.UTC(2024, 0, 1, 11, minute, 0)).toISOString(),
	u: { _id: 'user2', username: 'user2' }
});

/** From the connection cycle that already ended: its result must not land. */
const staleMessage = message('stale-1', 10);
/** From the current connection cycle. */
const freshMessage = message('fresh-1', 40);

const streamSubscriptions = () => [
	{ id: MESSAGES_STREAM_ID, name: 'stream-room-messages', params: [RID], unsubscribe: jest.fn(() => Promise.resolve()) }
];

describe('RoomSubscription stale catch-up fetch', () => {
	let listeners: Record<string, (message: any) => void>;
	/** Resolvers for every pending `chat.syncMessages` request, in call order. */
	let pending: ((result: any) => void)[];
	/** Subscriptions opened by a test, torn down afterwards. */
	let opened: RoomSubscription[];

	const reconnectSocket = () => {
		listeners.close?.({});
		listeners.connected?.({});
	};

	const ackRoomStream = () => listeners.ready({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });

	const flush = () => new Promise(resolve => setImmediate(resolve));

	/** Resolves the n-th (0-based) `chat.syncMessages` request, in call order. */
	const resolveRequest = async (index: number, result: any) => {
		pending[index]?.({ result });
		await flush();
	};

	/**
	 * Resolves both requests of the n-th (0-based) fetch with `updated` and no further page. Only
	 * valid while every fetch issues an UPDATED and a DELETED request — a continuation may issue one.
	 */
	const resolveFetch = async (index: number, updated: any[], next: number | null = null) => {
		await resolveRequest(index * 2, { updated, deleted: [], cursor: { next } });
		await resolveRequest(index * 2 + 1, { deleted: [], cursor: { next: null } });
	};

	beforeEach(() => {
		jest.clearAllMocks();
		listeners = {};
		pending = [];
		opened = [];
		mockedOnStreamData.mockImplementation((event: string, callback: (message: any) => void) => {
			listeners[event] = callback;
			return Promise.resolve({ stop: jest.fn() });
		});
		mockedSubscribeRoom.mockResolvedValue(streamSubscriptions());
		mockedGetSubscriptionById.mockImplementation((id: string) => streamSubscriptions().find(sub => sub.id === id));
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR } as never);
		mockedSdkGet.mockImplementation(() => new Promise(resolve => pending.push(resolve)) as never);
	});

	// The room stream ready signal goes through a module-level emitter, so a subscription left alive
	// keeps fetching into the next test.
	afterEach(async () => {
		await Promise.all(opened.map(subscription => subscription.unsubscribe()));
	});

	const openRoom = async () => {
		const subscription = new RoomSubscription(RID);
		opened.push(subscription);
		await subscription.subscribe();
		await flush();
		return subscription;
	};

	it('ignores a fetch from a previous connection cycle resolving after the current one', async () => {
		await openRoom();

		// cycle 1: fetch starts and stays in flight
		reconnectSocket();
		ackRoomStream();
		await flush();

		// cycle 2: a second reconnect fetches and lands first
		reconnectSocket();
		ackRoomStream();
		await flush();
		await resolveFetch(1, [freshMessage]);

		// cycle 1's fetch resolves late
		await resolveFetch(0, [staleMessage]);

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({ update: [expect.objectContaining({ _id: freshMessage._id })] })
		);
	});

	it('does not move the sync cursor from a previous connection cycle', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();

		reconnectSocket();
		ackRoomStream();
		await flush();
		await resolveFetch(1, [freshMessage]);
		await resolveFetch(0, [staleMessage]);

		expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
		expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [expect.objectContaining({ _updatedAt: freshMessage._updatedAt })]);
	});

	it('ignores a fetch that resolves after the room is left', async () => {
		const subscription = await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();
		await subscription.unsubscribe();
		await resolveFetch(0, [staleMessage]);

		expect(mockedUpdateMessages).not.toHaveBeenCalled();
		expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		expect(readMessages).not.toHaveBeenCalled();
	});

	it('stops paginating when the connection cycle ends mid-walk', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();
		// first page lands while the cycle is still current, and asks for another
		await resolveFetch(0, [freshMessage], new Date(freshMessage._updatedAt).getTime());

		reconnectSocket();
		// the continuation resolves after the cycle ended: no write, and the cursor stays put
		await resolveRequest(2, { updated: [staleMessage], deleted: [], cursor: { next: null } });

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
	});

	it('still fetches on the next ack after a stale fetch was dropped', async () => {
		await openRoom();

		reconnectSocket();
		ackRoomStream();
		await flush();

		// the socket drops again before the fetch resolves, so its result is dropped — and dropping
		// it must not mark the reconnect as caught up
		reconnectSocket();
		await resolveFetch(0, [staleMessage]);

		ackRoomStream();
		await flush();
		await resolveFetch(1, [freshMessage]);

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({ update: [expect.objectContaining({ _id: freshMessage._id })] })
		);
	});
});
