import { applyMiddleware, createStore, type AnyAction, type Store } from 'redux';
import createSagaMiddleware from 'redux-saga';

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
				} else if (message.msg === 'method' && message.method === 'login') {
					setImmediate(() =>
						connection.onmessage({
							data: JSON.stringify({ msg: 'result', id: message.id, result: { id: USER_ID, token: RESUME_TOKEN } })
						})
					);
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

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	saveLastLocalAuthenticationSession: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('../../lib/notifications', () => ({
	checkPendingNotification: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		reset: jest.fn(),
		drainPendingHangups: jest.fn()
	}
}));

jest.mock('../../lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('../../lib/services/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../lib/methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('../../lib/methods/loadMissedMessages', () => ({
	loadMissedMessages: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/helpers/markMessagesRead', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	events: {},
	logEvent: jest.fn()
}));

jest.mock('../../lib/encryption', () => ({
	Encryption: { decryptMessage: jest.fn(async (message: unknown) => message) }
}));

jest.mock('../../lib/database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../lib/database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		setActiveDB: jest.fn(),
		servers: { get: jest.fn(), write: jest.fn() },
		active: {
			get: jest.fn(),
			write: jest.fn(),
			batch: jest.fn()
		}
	}
}));

import RoomSubscription from '../../lib/methods/subscriptions/room';
import databaseModule from '../../lib/database';
import { connect } from '../../lib/services/connect';
import { loadMissedMessages } from '../../lib/methods/loadMissedMessages';
import { initStore } from '../../lib/store/auxStore';
import { APP_STATE } from '../../actions/actionsTypes';
import { appStart } from '../../actions/app';
import { loginRequest, loginSuccess } from '../../actions/login';
import { connectSuccess, disconnect } from '../../actions/connect';
import { selectServerSuccess } from '../../actions/server';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import loginRoot from '../login';
import stateRoot from '../state';

interface MockConnection {
	send: jest.Mock;
	close: jest.Mock;
	readyState: number;
	onopen: () => void;
	onmessage: (event: { data: string }) => void;
	onerror: () => void;
	onclose: (event?: { code?: number }) => void;
}

interface WireFrame {
	msg: string;
	id?: string;
	name?: string;
	params?: unknown[];
}

const mockConnections: MockConnection[] = [];

const SERVER = 'https://open.rocket.chat';
const USER_ID = 'user-id';
const RESUME_TOKEN = 'token-abc';
const ROOM_ID = 'room-rid';
const RECOVERY_WINDOW = 5000;

const database = databaseModule as unknown as {
	setActiveDB: jest.Mock;
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

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

function stopAnsweringFrames(connection: MockConnection) {
	connection.send.mockImplementation(() => undefined);
}

function makeCollection(name: string) {
	return {
		name,
		find: jest.fn(),
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) })),
		create: jest.fn(),
		prepareCreate: jest.fn(),
		schema: { columnArray: [] }
	};
}

let dispatched: AnyAction[];
let store: Store;
let collections: Record<string, ReturnType<typeof makeCollection>>;

function recordDispatched() {
	return () => (next: (action: AnyAction) => AnyAction) => (action: AnyAction) => {
		dispatched.push(action);
		return next(action);
	};
}

function bootSignedInApp() {
	dispatched = [];
	const sagaMiddleware = createSagaMiddleware();
	store = createStore(reducers, applyMiddleware(recordDispatched(), sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	sagaMiddleware.run(loginRoot);
	initStore(store);
	store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
	store.dispatch(selectServerSuccess({ server: SERVER, name: 'open.rocket.chat', version: '6.0.0' }));
	return store;
}

async function openSignedInSocket() {
	await connect({ server: SERVER });
	await flush();
	mockConnections[0].onopen();
	await flush();
	store.dispatch(loginSuccess({ id: USER_ID, token: RESUME_TOKEN } as never));
	store.dispatch(connectSuccess());
	await flush();
}

async function subscribeToRoom(rid: string) {
	const room = new RoomSubscription(rid);
	const subscribing = room.subscribe();
	await flush();
	await subscribing;
	await flush();
	return room;
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockConnections.length = 0;
	collections = {};
	database.active.get.mockReset().mockImplementation((name: string) => (collections[name] ??= makeCollection(name)));
	database.active.write.mockReset().mockImplementation((fn: () => unknown) => fn());
	database.active.batch.mockReset().mockImplementation((...records: unknown[]) => Promise.resolve(records));
	global.fetch = jest.fn(() =>
		Promise.resolve({
			status: 200,
			json: () =>
				Promise.resolve({
					status: 'success',
					data: { userId: USER_ID, authToken: RESUME_TOKEN, me: { username: 'the-user', roles: ['user'], settings: {} } }
				})
		})
	) as unknown as typeof fetch;
});

afterEach(async () => {
	await flush();
	jest.useRealTimers();
});

describe('coming back to a conversation after the phone was locked', () => {
	it('gets messages flowing again when the socket died silently while away', async () => {
		bootSignedInApp();
		await openSignedInSocket();
		await subscribeToRoom(ROOM_ID);
		const frozen = mockConnections[0];
		const subscribedTopics = framesOn(frozen, 'sub').map(frame => frame.name);
		expect(subscribedTopics).toContain('stream-notify-logged');

		stopAnsweringFrames(frozen);
		const pingsBefore = framesOn(frozen, 'ping').length;
		dispatched.length = 0;
		jest.mocked(loadMissedMessages).mockClear();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(framesOn(frozen, 'ping').length).toBeGreaterThan(pingsBefore);
		expect(mockConnections).toHaveLength(2);
		const reopened = mockConnections[1];

		expect(loadMissedMessages).not.toHaveBeenCalled();

		reopened.onopen();
		await flush();
		await flush();

		expect(dispatched).toContainEqual(connectSuccess());
		expect(dispatched).toContainEqual(loginRequest({ resume: RESUME_TOKEN }, false));
		expect(loadMissedMessages).toHaveBeenCalledWith({ rid: ROOM_ID });
		expect(framesOn(reopened, 'sub').map(frame => frame.name)).toEqual(expect.arrayContaining(['stream-notify-logged']));
	});
});

describe('coming back after the network dropped while the app was away', () => {
	it('lands on a reconnected, still-signed-in app instead of forcing a relaunch', async () => {
		bootSignedInApp();
		await openSignedInSocket();
		const dropped = mockConnections[0];

		dropped.readyState = 3;
		dropped.onclose({ code: 1006 });
		await flush();
		expect(dispatched).toContainEqual(disconnect());
		dispatched.length = 0;

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(mockConnections.length).toBeGreaterThan(1);
		const reopened = mockConnections[mockConnections.length - 1];

		reopened.onopen();
		await flush();

		const connectSuccessAt = dispatched.findIndex(action => action.type === connectSuccess().type);
		const loginRequestAt = dispatched.findIndex(action => action.type === loginRequest({ resume: RESUME_TOKEN }, false).type);
		expect(connectSuccessAt).toBeGreaterThanOrEqual(0);
		expect(loginRequestAt).toBeGreaterThan(connectSuccessAt);
		expect(dispatched[loginRequestAt]).toEqual(loginRequest({ resume: RESUME_TOKEN }, false));

		expect(framesOn(reopened, 'connect').length).toBeGreaterThan(0);
	});
});

describe('switching away and straight back to the app', () => {
	it('keeps the live connection instead of paying for an avoidable reconnect', async () => {
		bootSignedInApp();
		await openSignedInSocket();
		await subscribeToRoom(ROOM_ID);
		const alive = mockConnections[0];
		const pingsBefore = framesOn(alive, 'ping').length;
		const connectFramesBefore = framesOn(alive, 'connect').length;
		const connectionsBefore = mockConnections.length;
		dispatched.length = 0;

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(framesOn(alive, 'ping').length).toBeGreaterThan(pingsBefore);
		expect(mockConnections).toHaveLength(connectionsBefore);
		expect(framesOn(alive, 'connect')).toHaveLength(connectFramesBefore);
		expect(dispatched.map(action => action.type)).not.toContain(connectSuccess().type);
		expect(dispatched.map(action => action.type)).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});
});
