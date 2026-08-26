jest.unmock('@rocket.chat/sdk');

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../../testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('../../../encryption', () => ({
	Encryption: { decryptMessage: jest.fn(async (message: unknown) => message) }
}));

jest.mock('../../helpers/buildMessage', () => ({
	__esModule: true,
	default: jest.fn((message: unknown) => message)
}));

jest.mock('../../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../../services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('../../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('../../readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('../../loadMissedMessages', () => ({
	loadMissedMessages: jest.fn()
}));

jest.mock('../../helpers/markMessagesRead', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../../database', () => ({
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
import sdk from '../../../services/sdk';
import { initStore } from '../../../store/auxStore';
import { getMessageById } from '../../../database/services/Message';
import buildMessage from '../../helpers/buildMessage';
import { subscribeRoom, unsubscribeRoom } from '../../../../actions/room';
import { clearUserTyping } from '../../../../actions/usersTyping';
import {
	flush,
	framesOn,
	makeCollection as makeBaseCollection,
	makeReduxStore,
	receiveFrame
} from '../../../testUtils/sdkIntegration';
import type { IMockCollection, MockConnection } from '../../../testUtils/sdkIntegration';
import type * as SdkIntegration from '../../../testUtils/sdkIntegration';

const database = require('../../../database').default as {
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
	await flush();
	mockConnections[0].onopen();
	await flush();
	await connectPromise;
}

async function subscribeToRoom(rid: string) {
	const room = new RoomSubscription(rid);
	const subscribing = room.subscribe();
	await flush();
	await subscribing;
	await flush();
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
		await flush();

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
		await flush();

		expect(framesOn(mockConnections[0], 'unsub')).toHaveLength(5);
		expect(redux.store.dispatch).toHaveBeenCalledWith(unsubscribeRoom('room-rid'));
		expect(redux.store.dispatch).toHaveBeenCalledWith(clearUserTyping());

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});
		await flush();

		expect(buildMessage).not.toHaveBeenCalled();
	});
});
