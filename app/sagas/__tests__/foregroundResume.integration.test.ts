jest.unmock('@rocket.chat/sdk');

import { applyMiddleware, createStore, type AnyAction, type Store } from 'redux';
import createSagaMiddleware from 'redux-saga';

import type * as SdkIntegration from '../../lib/testUtils/sdkIntegration';
import type { MockConnection } from '../../lib/testUtils/sdkIntegration';

const USER_ID = 'user-id';
const RESUME_TOKEN = 'auth-token';
const CLOSED = 3;
const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
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
import sdk from '../../lib/services/sdk';
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
import {
	flush,
	framesOn,
	latestConnection,
	makeCollection,
	settle,
	stopAnsweringFrames
} from '../../lib/testUtils/sdkIntegration';
import { saveLastLocalAuthenticationSession } from '../../lib/methods/helpers/localAuthentication';
import { setUserPresenceAway } from '../../lib/services/restApi';

const SERVER = 'https://open.rocket.chat';
const ROOM_ID = 'room-rid';
const RECOVERY_WINDOW = 5000;

const database = databaseModule as unknown as {
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

const ROOM_TOPICS = [
	`stream-room-messages:${ROOM_ID}`,
	`stream-notify-room:${ROOM_ID}/user-activity`,
	`stream-notify-room:${ROOM_ID}/deleteMessage`,
	`stream-notify-room:${ROOM_ID}/deleteMessageBulk`,
	`stream-notify-room:${ROOM_ID}/messagesRead`
];

function topicsOn(connection: MockConnection) {
	return framesOn(connection, 'sub').map(frame => `${frame.name}:${frame.params?.[0]}`);
}

function roomTopicsOn(connection: MockConnection) {
	return topicsOn(connection).filter(topic => topic.includes(ROOM_ID));
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

function bootApp() {
	dispatched = [];
	const sagaMiddleware = createSagaMiddleware();
	store = createStore(reducers, applyMiddleware(recordDispatched(), sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	sagaMiddleware.run(loginRoot);
	initStore(store);
	store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
	store.dispatch(selectServerSuccess({ server: SERVER, name: 'open.rocket.chat', version: '6.0.0' }));
}

async function openSocket() {
	await connect({ server: SERVER });
	await flush();
	mockConnections[0].onopen();
	await flush();
	store.dispatch(connectSuccess());
	await flush();
}

async function openSignedInSocket() {
	await openSocket();
	store.dispatch(loginSuccess({ id: USER_ID, token: RESUME_TOKEN } as never));
	await flush();
}

function resumedUser() {
	const resumed = dispatched.find(action => action.type === loginSuccess({} as never).type);
	return resumed?.user;
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
	sdk.disconnect();
	await flush();
	jest.useRealTimers();
});

describe('foreground resume over the real SDK socket', () => {
	it('gets messages flowing again when the socket died silently while away', async () => {
		bootApp();
		await openSignedInSocket();
		await subscribeToRoom(ROOM_ID);
		const frozen = mockConnections[0];
		expect(roomTopicsOn(frozen)).toEqual(expect.arrayContaining(ROOM_TOPICS));

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
		await settle();

		expect(dispatched).toContainEqual(connectSuccess());
		expect(dispatched).toContainEqual(loginRequest({ resume: RESUME_TOKEN }, false));
		expect(loadMissedMessages).toHaveBeenCalledWith({ rid: ROOM_ID });
		expect(roomTopicsOn(reopened)).toEqual(expect.arrayContaining(ROOM_TOPICS));
		expect(resumedUser()).toEqual(expect.objectContaining({ id: USER_ID, token: RESUME_TOKEN, username: 'the-user' }));
	});

	it('lands on a reconnected, still-signed-in app instead of forcing a relaunch after the network dropped while away', async () => {
		bootApp();
		await openSignedInSocket();
		const dropped = mockConnections[0];

		dropped.readyState = CLOSED;
		dropped.onclose({ code: 1006 });
		await flush();
		expect(dispatched).toContainEqual(disconnect());
		dispatched.length = 0;

		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);
		expect(mockConnections).toHaveLength(1);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(mockConnections.length).toBeGreaterThan(1);
		const reopened = latestConnection(mockConnections);

		reopened.onopen();
		await settle();

		const connectSuccessAt = dispatched.findIndex(action => action.type === connectSuccess().type);
		const loginRequestAt = dispatched.findIndex(action => action.type === loginRequest({ resume: RESUME_TOKEN }, false).type);
		expect(connectSuccessAt).toBeGreaterThanOrEqual(0);
		expect(loginRequestAt).toBeGreaterThan(connectSuccessAt);
		expect(dispatched[loginRequestAt]).toEqual(loginRequest({ resume: RESUME_TOKEN }, false));
		expect(resumedUser()).toEqual(expect.objectContaining({ id: USER_ID, token: RESUME_TOKEN, username: 'the-user' }));

		expect(framesOn(reopened, 'connect').length).toBeGreaterThan(0);
	});

	it('keeps the live connection instead of paying for an avoidable reconnect when switching straight back', async () => {
		bootApp();
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

	it('leaves the socket alone when the app returns to the foreground before anyone is signed in', async () => {
		bootApp();
		await openSocket();
		const frozen = mockConnections[0];
		stopAnsweringFrames(frozen);
		dispatched.length = 0;

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(framesOn(frozen, 'ping')).toHaveLength(0);
		expect(mockConnections).toHaveLength(1);
		expect(dispatched.map(action => action.type)).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});

	it('leaves the socket alone when the app returns to the foreground on the Outside Stack', async () => {
		bootApp();
		await openSignedInSocket();
		const frozen = mockConnections[0];
		stopAnsweringFrames(frozen);
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await flush();
		const pingsBefore = framesOn(frozen, 'ping').length;
		dispatched.length = 0;

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flush();
		await jest.advanceTimersByTimeAsync(RECOVERY_WINDOW);

		expect(framesOn(frozen, 'ping')).toHaveLength(pingsBefore);
		expect(mockConnections).toHaveLength(1);
		expect(dispatched.map(action => action.type)).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});

	it('saves the local authentication session and goes away when the app leaves for the background', async () => {
		bootApp();
		await openSignedInSocket();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await flush();

		expect(saveLastLocalAuthenticationSession).toHaveBeenCalledWith(SERVER);
		expect(setUserPresenceAway).toHaveBeenCalled();
	});

	it('stays quiet on the background transition when nobody is signed in', async () => {
		bootApp();
		await openSocket();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await flush();

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});

	it('stays quiet on the background transition while the socket is down', async () => {
		bootApp();
		await openSignedInSocket();
		store.dispatch(disconnect());
		await flush();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await flush();

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});

	it('stays quiet on the background transition while on the Outside Stack', async () => {
		bootApp();
		await openSignedInSocket();
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await flush();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await flush();

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});
});
