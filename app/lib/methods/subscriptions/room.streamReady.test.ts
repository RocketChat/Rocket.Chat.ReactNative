import RoomSubscription from './room';
import sdk from '../../services/sdk';
import { emitter, roomStreamReadyEvent } from '../helpers/emitter';

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribeRoom: jest.fn(),
		onStreamData: jest.fn(),
		getSubscriptionById: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn() } }
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' }, settings: {}, login: { user: {} }, room: {} })),
		dispatch: jest.fn()
	}
}));

jest.mock('../readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../loadMissedMessages', () => ({ loadMissedMessages: jest.fn() }));
jest.mock('../../encryption', () => ({ Encryption: { decryptMessage: jest.fn(m => m) } }));

const mockedSubscribeRoom = sdk.subscribeRoom as jest.Mock;
const mockedOnStreamData = sdk.onStreamData as jest.Mock;
const mockedGetSubscriptionById = sdk.getSubscriptionById as jest.Mock;

const RID = 'ROOM_ID';
const MESSAGES_STREAM_ID = 'stream-room-messages-id';

const streamSubscriptions = () => [
	{ id: MESSAGES_STREAM_ID, name: 'stream-room-messages', params: [RID], unsubscribe: jest.fn(() => Promise.resolve()) },
	{
		id: 'notify-room-id',
		name: 'stream-notify-room',
		params: [`${RID}/typing`],
		unsubscribe: jest.fn(() => Promise.resolve())
	}
];

describe('RoomSubscription stream ready signal', () => {
	/** Listeners registered by the subscription, keyed by the DDP event they listen to. */
	let listeners: Record<string, (message: any) => void>;
	let onStreamReady: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		listeners = {};
		mockedOnStreamData.mockImplementation((event: string, callback: (message: any) => void) => {
			listeners[event] = callback;
			return Promise.resolve({ stop: jest.fn() });
		});
		mockedSubscribeRoom.mockResolvedValue(streamSubscriptions());
		// Mirrors the SDK: subscriptions are only registered once the server has acked them.
		mockedGetSubscriptionById.mockImplementation((id: string) => streamSubscriptions().find(sub => sub.id === id));
		onStreamReady = jest.fn();
		emitter.on(roomStreamReadyEvent(RID), onStreamReady);
	});

	afterEach(() => {
		emitter.off(roomStreamReadyEvent(RID), onStreamReady);
	});

	it('fires once the server acks the room messages stream on first connect', async () => {
		await new RoomSubscription(RID).subscribe();

		expect(onStreamReady).toHaveBeenCalledTimes(1);
	});

	it('does not fire at socket open, only when the ack arrives', async () => {
		let ackSubscriptions: (subscriptions: unknown[]) => void = () => {};
		mockedSubscribeRoom.mockReturnValue(
			new Promise(resolve => {
				ackSubscriptions = resolve;
			})
		);

		await new RoomSubscription(RID).subscribe();
		// socket is open and the listeners are wired, but the server hasn't acked yet
		listeners.connected?.({});
		await Promise.resolve();
		expect(onStreamReady).not.toHaveBeenCalled();

		ackSubscriptions(streamSubscriptions());
		await Promise.resolve();
		await Promise.resolve();

		expect(onStreamReady).toHaveBeenCalledTimes(1);
	});

	it('fires again on every reconnect that re-acks the same subscription id', async () => {
		await new RoomSubscription(RID).subscribe();
		onStreamReady.mockClear();

		listeners.ready({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });
		listeners.ready({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });

		expect(onStreamReady).toHaveBeenCalledTimes(2);
	});

	it('still fires on reconnect when the first connect never acked', async () => {
		mockedSubscribeRoom.mockRejectedValue(new Error('socket closed'));

		await new RoomSubscription(RID).subscribe();
		await Promise.resolve();
		expect(onStreamReady).not.toHaveBeenCalled();

		listeners.ready({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });

		expect(onStreamReady).toHaveBeenCalledTimes(1);
	});

	it('ignores an ack for another room messages stream', async () => {
		await new RoomSubscription(RID).subscribe();
		onStreamReady.mockClear();
		mockedGetSubscriptionById.mockReturnValue({ id: 'other', name: 'stream-room-messages', params: ['OTHER_ROOM'] });

		listeners.ready({ msg: 'ready', subs: ['other'] });

		expect(onStreamReady).not.toHaveBeenCalled();
	});

	it('ignores acks for other subscriptions', async () => {
		await new RoomSubscription(RID).subscribe();
		onStreamReady.mockClear();

		listeners.ready({ msg: 'ready', subs: ['some-other-subscription'] });

		expect(onStreamReady).not.toHaveBeenCalled();
	});

	it('stops firing after unsubscribe', async () => {
		const subscription = new RoomSubscription(RID);
		await subscription.subscribe();
		const handleStreamReady = listeners.ready;
		await subscription.unsubscribe();
		onStreamReady.mockClear();

		handleStreamReady({ msg: 'ready', subs: [MESSAGES_STREAM_ID] });

		expect(onStreamReady).not.toHaveBeenCalled();
	});
});
