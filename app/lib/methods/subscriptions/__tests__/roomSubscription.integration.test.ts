import type { Store } from 'redux';

// The repo auto-applies `__mocks__/@rocket.chat/sdk.js` (an empty class). Drive the real SDK.
jest.unmock('@rocket.chat/sdk');

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const connection = {
			send: jest.fn((data: string) => {
				const message = JSON.parse(data) as { msg: string; id?: string; method?: string };
				if (message.msg === 'connect') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'connected', session: 'session-id' }) }));
				} else if (message.msg === 'ping') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'pong' }) }));
				} else if (message.msg === 'sub') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'ready', subs: [message.id] }) }));
				} else if (message.msg === 'unsub') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'nosub', id: message.id }) }));
				}
			}),
			close: jest.fn(),
			readyState: 1,
			onopen: jest.fn(),
			onmessage: jest.fn(),
			onerror: jest.fn(),
			onclose: jest.fn()
		};
		mockConnections.push(connection);
		return connection;
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

jest.mock('../../../services/twoFactor', () => ({
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
import type { IApplicationState } from '../../../../definitions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const database = require('../../../database').default as {
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

interface MockConnection {
	send: jest.Mock;
	close: jest.Mock;
	readyState: number;
	onopen: () => void;
	onmessage: (event: { data: string }) => void;
	onerror: () => void;
	onclose: () => void;
}

interface WireFrame {
	msg: string;
	id?: string;
	name?: string;
	params?: unknown[];
}

const mockConnections: MockConnection[] = [];

function makeReduxStore() {
	const listeners = new Set<() => void>();
	const state = {
		login: { user: null as Record<string, unknown> | null, isAuthenticated: false },
		server: { version: '5.0.0' },
		settings: {} as Record<string, unknown>,
		room: { subscribedRoom: 'room-rid' as string | null }
	};
	return {
		state,
		store: {
			getState: () => state,
			dispatch: jest.fn(),
			subscribe: (listener: () => void) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		} as unknown as Store<IApplicationState>
	};
}

async function flush(turns = 10) {
	for (let i = 0; i < turns; i++) {
		await Promise.resolve();
		await jest.advanceTimersByTimeAsync(0);
	}
}

function framesOn(connection: MockConnection, msg: string) {
	return connection.send.mock.calls
		.map(([data]: [string]) => JSON.parse(data) as WireFrame)
		.filter(message => message.msg === msg);
}

function receiveFrame(connection: MockConnection, frame: Record<string, unknown>) {
	connection.onmessage({ data: JSON.stringify(frame) });
}

function makeCollection(name: string) {
	return {
		name,
		find: jest.fn(),
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) })),
		create: jest.fn(),
		prepareCreate: jest.fn((fn: (record: Record<string, unknown>) => void) => {
			const record = { _raw: { id: '' }, subscription: { id: '' } };
			fn(record);
			return record;
		}),
		schema: { columnArray: [] }
	};
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

/** Build a real SDK client, open its socket, and settle the handshake. */
async function connectDriver() {
	sdk.initialize('https://example.com');
	const connectPromise = (sdk.current as unknown as { connect(): Promise<unknown> }).connect();
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

		// A frame on the room stream after unsubscribe no longer reaches the handler.
		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-room-messages',
			fields: { eventName: 'room-rid', args: [MESSAGE] }
		});
		await flush();

		expect(buildMessage).not.toHaveBeenCalled();
	});
});
