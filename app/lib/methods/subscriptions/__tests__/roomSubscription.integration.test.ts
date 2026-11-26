jest.unmock('@rocket.chat/sdk');

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('~/lib/encryption', () => ({
	Encryption: { decryptMessage: jest.fn(async (message: unknown) => message) }
}));

jest.mock('~/lib/methods/helpers/buildMessage', () => ({
	__esModule: true,
	default: jest.fn((message: unknown) => message)
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('~/lib/methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('~/lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('~/lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('~/lib/database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('~/lib/methods/readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('~/lib/methods/loadMissedMessages', () => ({
	loadMissedMessages: jest.fn()
}));

jest.mock('~/lib/methods/helpers/markMessagesRead', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(),
			write: jest.fn(),
			batch: jest.fn()
		}
	}
}));

import RoomSubscription from '../room';
import sdk from '~/lib/services/sdk';
import { initStore } from '~/lib/store/auxStore';
import { getMessageById } from '~/lib/database/services/Message';
import buildMessage from '~/lib/methods/helpers/buildMessage';
import { loadMissedMessages } from '~/lib/methods/loadMissedMessages';
import { readMessages } from '~/lib/methods/readMessages';
import { subscribeRoom, unsubscribeRoom } from '~/actions/room';
import { clearUserTyping } from '~/actions/usersTyping';
import {
	flushMicrotasksAndTimers,
	framesOn,
	makeCollection as makeBaseCollection,
	makeReduxStore,
	receiveFrame,
	stopAnsweringFrames
} from '~/lib/testUtils/sdkIntegration';
import type { IMockCollection, MockConnection } from '~/lib/testUtils/sdkIntegration';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';

const database = require('~/lib/database').default as {
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

const mockConnections: MockConnection[] = [];

function makeCollection(name: string): IMockCollection {
	const collection = makeBaseCollection(name);
	collection.prepareCreate.mockImplementation((fn: (record: Record<string, unknown>) => void) => {
		const record = { _raw: { id: '' }, subscription: { id: '' } };
		fn(record);
		return record;
	});
	collection.schema = { columnArray: [] };
	return collection;
}

const MESSAGE = {
	_id: 'msg-1',
	rid: 'room-rid',
	msg: 'hello',
	u: { _id: 'user-id', username: 'the-user' },
	ts: { $date: 1700000000000 }
};

let redux: ReturnType<typeof makeReduxStore>;
let collections: Record<string, ReturnType<typeof makeCollection>>;

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockConnections.length = 0;
	collections = {};
	redux = makeReduxStore();
	initStore(redux.store);
	database.active.get.mockReset().mockImplementation((name: string) => (collections[name] ??= makeCollection(name)));
	database.active.write.mockReset().mockImplementation((fn: () => unknown) => fn());
	database.active.batch.mockReset().mockImplementation((...records: unknown[]) => Promise.resolve(records));
	(getMessageById as jest.Mock).mockResolvedValue(null);
});

afterEach(() => {
	jest.useRealTimers();
});

async function connectDriver() {
	sdk.initialize('https://example.com');
	const connectPromise = sdk.connect();
	await flushMicrotasksAndTimers();
	mockConnections[0].onopen();
	await flushMicrotasksAndTimers();
	await connectPromise;
}

async function subscribeToRoom(rid: string) {
	const room = new RoomSubscription(rid);
	const subscribing = room.subscribe();
	await flushMicrotasksAndTimers();
	await subscribing;
	await flushMicrotasksAndTimers();
	return room;
}

describe('RoomSubscription over the real SDK', () => {
	it('subscribes to the room streams and registers the store subscription', async () => {
		await connectDriver();

		await subscribeToRoom('room-rid');

		expect(framesOn(mockConnections[0], 'sub')).toHaveLength(5);
		expect(redux.store.dispatch).toHaveBeenCalledWith(subscribeRoom('room-rid'));
	});

	it('routes a stream-room-messages frame into a written message', async () => {
		await connectDriver();
		await subscribeToRoom('room-rid');

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});
		await flushMicrotasksAndTimers();

		expect(buildMessage).toHaveBeenCalledTimes(1);
		expect(getMessageById).toHaveBeenCalledWith('msg-1');
		expect(database.active.write).toHaveBeenCalled();
		const record = database.active.batch.mock.calls[0][0];
		expect(record).toMatchObject({ _id: 'msg-1', rid: 'room-rid', msg: 'hello' });
	});

	it('stops its listeners and unsubscribes all five subscriptions', async () => {
		await connectDriver();
		const room = await subscribeToRoom('room-rid');

		await room.unsubscribe();
		await flushMicrotasksAndTimers();

		expect(framesOn(mockConnections[0], 'unsub')).toHaveLength(5);
		expect(redux.store.dispatch).toHaveBeenCalledWith(unsubscribeRoom('room-rid'));
		expect(redux.store.dispatch).toHaveBeenCalledWith(clearUserTyping());

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});
		await flushMicrotasksAndTimers();

		expect(buildMessage).not.toHaveBeenCalled();
	});

	describe('while the stream subscription starts', () => {
		function answerSubscriptions(connection: MockConnection) {
			framesOn(connection, 'sub').forEach(frame => receiveFrame(connection, { msg: 'ready', subs: [frame.id] }));
		}

		async function subscribeWithoutAnswers(rid: string) {
			await connectDriver();
			stopAnsweringFrames(mockConnections[0], 'sub');
			const room = new RoomSubscription(rid);
			const subscribing = room.subscribe();
			await flushMicrotasksAndTimers();
			return { room, subscribing };
		}

		it('loads the Messages sent before the stream became ready', async () => {
			const { subscribing } = await subscribeWithoutAnswers('room-rid');
			expect(loadMissedMessages).not.toHaveBeenCalled();

			answerSubscriptions(mockConnections[0]);
			await flushMicrotasksAndTimers();
			await subscribing;

			expect(loadMissedMessages).toHaveBeenCalledTimes(1);
			expect(loadMissedMessages).toHaveBeenCalledWith({ rid: 'room-rid' });
		});

		it('loads nothing when the user leaves the Room before the stream is ready', async () => {
			const { room, subscribing } = await subscribeWithoutAnswers('room-rid');

			const leaving = room.unsubscribe();
			answerSubscriptions(mockConnections[0]);
			await flushMicrotasksAndTimers();
			await Promise.all([leaving, subscribing]);

			expect(loadMissedMessages).not.toHaveBeenCalled();
		});

		it('does not mark the Room read when the user leaves while the catch-up loads', async () => {
			let finishLoading: () => void = () => {};
			(loadMissedMessages as jest.Mock).mockImplementationOnce(
				() =>
					new Promise<void>(resolve => {
						finishLoading = resolve;
					})
			);
			const { room, subscribing } = await subscribeWithoutAnswers('room-rid');
			answerSubscriptions(mockConnections[0]);
			await flushMicrotasksAndTimers();
			expect(loadMissedMessages).toHaveBeenCalledTimes(1);

			await room.unsubscribe();
			finishLoading();
			await subscribing;
			jest.advanceTimersByTime(1000);

			expect(readMessages).not.toHaveBeenCalled();
		});

		it('does not mark the Room read when the user leaves within the read delay', async () => {
			const { room, subscribing } = await subscribeWithoutAnswers('room-rid');
			answerSubscriptions(mockConnections[0]);
			await flushMicrotasksAndTimers();
			await subscribing;

			await room.unsubscribe();
			jest.advanceTimersByTime(1000);

			expect(readMessages).not.toHaveBeenCalled();
		});
	});
});
