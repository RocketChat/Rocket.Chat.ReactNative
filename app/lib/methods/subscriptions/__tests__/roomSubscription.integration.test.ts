jest.unmock('@rocket.chat/sdk');

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

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
import { makeCollection as makeBaseCollection, makeReduxStore } from '../../../testUtils/appMocks';
import type { IMockCollection } from '../../../testUtils/appMocks';
import { createTransportFake } from '../../../testUtils/sdkTransport';

const database = require('../../../database').default as {
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

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
	mockTransport.reset();
	collections = {};
	redux = makeReduxStore();
	initStore(redux.store);
	database.active.get.mockReset().mockImplementation((name: string) => (collections[name] ??= makeCollection(name)));
	database.active.write.mockReset().mockImplementation((fn: () => unknown) => fn());
	database.active.batch.mockReset().mockImplementation((...records: unknown[]) => Promise.resolve(records));
	(getMessageById as jest.Mock).mockResolvedValue(null);
});

afterEach(() => {
	sdk.disconnect();
	jest.useRealTimers();
});

async function connectDriver() {
	sdk.initialize('https://example.com');
	const connecting = sdk.connect();
	mockTransport.open(await mockTransport.awaitConnection());
	await connecting;
}

async function subscribeToRoom(rid: string) {
	const room = new RoomSubscription(rid);
	await room.subscribe();
	return room;
}

function nextBatchedRecords(): Promise<unknown[]> {
	return new Promise(resolve => {
		database.active.batch.mockImplementation((...records: unknown[]) => {
			resolve(records);
			return Promise.resolve(records);
		});
	});
}

describe('RoomSubscription over the real SDK', () => {
	it('subscribes to the room streams and registers the store subscription', async () => {
		await connectDriver();

		await subscribeToRoom('room-rid');

		expect(mockTransport.frames({ msg: 'sub' })).toHaveLength(5);
		expect(redux.store.dispatch).toHaveBeenCalledWith(subscribeRoom('room-rid'));
	});

	it('routes a stream-room-messages frame into a written message', async () => {
		await connectDriver();
		await subscribeToRoom('room-rid');

		const batched = nextBatchedRecords();
		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});

		expect(await batched).toMatchObject([{ _id: 'msg-1', rid: 'room-rid', msg: 'hello' }]);
		expect(buildMessage).toHaveBeenCalledTimes(1);
		expect(getMessageById).toHaveBeenCalledWith('msg-1');
		expect(database.active.write).toHaveBeenCalled();
	});

	it('stops its listeners and unsubscribes all five subscriptions', async () => {
		await connectDriver();
		const room = await subscribeToRoom('room-rid');

		await room.unsubscribe();

		expect(mockTransport.frames({ msg: 'unsub' })).toHaveLength(5);
		expect(redux.store.dispatch).toHaveBeenCalledWith(unsubscribeRoom('room-rid'));
		expect(redux.store.dispatch).toHaveBeenCalledWith(clearUserTyping());

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});

		expect(buildMessage).not.toHaveBeenCalled();
	});
});
