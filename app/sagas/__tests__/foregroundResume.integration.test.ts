jest.unmock('@rocket.chat/sdk');

import { applyMiddleware, createStore, type AnyAction, type Store } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { createActionRecorder, trackCalls } from '../../lib/testUtils/observedEffects';
import { createTransportFake } from '../../lib/testUtils/sdkTransport';
import type { FakeConnection } from '../../lib/testUtils/sdkTransport';

const USER_ID = 'user-id';
const RESUME_TOKEN = 'auth-token';
const CLOSED = 3;

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

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

jest.mock('../../lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../lib/methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('../../lib/methods/syncRoom', () => ({
	syncRoom: jest.fn(() => Promise.resolve())
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
import { syncRoom } from '../../lib/methods/syncRoom';
import { makeCollection } from '../../lib/testUtils/appMocks';
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
import { saveLastLocalAuthenticationSession } from '../../lib/methods/helpers/localAuthentication';
import { setUserPresenceAway, setUserPresenceOnline } from '../../lib/services/restApi';

const SERVER = 'https://open.rocket.chat';
const ROOM_ID = 'room-rid';
const ROUND_TRIP_BUDGET = 2000;

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

const recorder = createActionRecorder();

let store: Store;
let collections: Record<string, ReturnType<typeof makeCollection>>;

function roomTopicsOn(connection: FakeConnection): string[] {
	return mockTransport
		.frames({ msg: 'sub' }, connection)
		.map(frame => `${frame.name}:${frame.params?.[0]}`)
		.filter(topic => topic.includes(ROOM_ID));
}

function pingsOn(connection: FakeConnection): number {
	return mockTransport.frames({ msg: 'ping' }, connection).length;
}

function recordDispatched() {
	return () => (next: (action: AnyAction) => AnyAction) => (action: AnyAction) => {
		recorder.record(action);
		return next(action);
	};
}

function bootApp(): void {
	const sagaMiddleware = createSagaMiddleware();
	store = createStore(reducers, applyMiddleware(recordDispatched(), sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	sagaMiddleware.run(loginRoot);
	initStore(store);
	store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
	store.dispatch(selectServerSuccess({ server: SERVER, name: 'open.rocket.chat', version: '6.0.0' }));
}

async function openSocket(): Promise<FakeConnection> {
	const index = mockTransport.connections.length;
	const connecting = connect({ server: SERVER });
	const connection = await mockTransport.awaitConnection(index);
	mockTransport.open(connection);
	await connecting;
	await recorder.awaitAction(connectSuccess().type);
	return connection;
}

async function openSignedInSocket(): Promise<FakeConnection> {
	const connection = await openSocket();
	store.dispatch(loginSuccess({ id: USER_ID, token: RESUME_TOKEN } as never));
	await recorder.awaitAction(loginSuccess({} as never).type);
	return connection;
}

function resumedUser(): unknown {
	const resumed = recorder.actionsOfType(loginSuccess({} as never).type).pop();
	return resumed?.user;
}

async function subscribeToRoom(rid: string): Promise<RoomSubscription> {
	const room = new RoomSubscription(rid);
	await room.subscribe();
	return room;
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockTransport.reset();
	recorder.reset();
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

afterEach(() => {
	sdk.disconnect();
	jest.useRealTimers();
});

describe('foreground resume over the real SDK socket', () => {
	it('gets messages flowing again when the socket died silently while away', async () => {
		bootApp();
		const frozen = await openSignedInSocket();
		await subscribeToRoom(ROOM_ID);
		expect(roomTopicsOn(frozen)).toEqual(expect.arrayContaining(ROOM_TOPICS));

		mockTransport.withhold({ msg: 'ping' });
		const pingsBefore = pingsOn(frozen);
		recorder.reset();
		const syncs = trackCalls(jest.mocked(syncRoom));

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await mockTransport.awaitFrame({ msg: 'ping' }, frozen);

		expect(pingsOn(frozen)).toBeGreaterThan(pingsBefore);
		expect(syncRoom).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(ROUND_TRIP_BUDGET);
		const reopened = await mockTransport.awaitConnection(1);
		mockTransport.open(reopened);

		await recorder.awaitAction(loginSuccess({} as never).type);
		await syncs.awaitCall();

		expect(recorder.actions).toContainEqual(connectSuccess());
		expect(recorder.actions).toContainEqual(loginRequest({ resume: RESUME_TOKEN }, false));
		expect(syncRoom).toHaveBeenCalledWith({ rid: ROOM_ID });
		expect(roomTopicsOn(reopened)).toEqual(expect.arrayContaining(ROOM_TOPICS));
		expect(resumedUser()).toEqual(expect.objectContaining({ id: USER_ID, token: RESUME_TOKEN, username: 'the-user' }));
	});

	it('lands on a reconnected, still-signed-in app instead of forcing a relaunch after the network dropped while away', async () => {
		bootApp();
		const dropped = await openSignedInSocket();

		mockTransport.closeTransport(dropped);
		await recorder.awaitAction(disconnect().type);
		recorder.reset();

		expect(mockTransport.connections).toHaveLength(1);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		const reopened = await mockTransport.awaitConnection(1);
		mockTransport.open(reopened);

		await recorder.awaitAction(loginSuccess({} as never).type);

		const connectSuccessAt = recorder.types().indexOf(connectSuccess().type);
		const loginRequestAt = recorder.types().indexOf(loginRequest({ resume: RESUME_TOKEN }, false).type);
		expect(connectSuccessAt).toBeGreaterThanOrEqual(0);
		expect(loginRequestAt).toBeGreaterThan(connectSuccessAt);
		expect(recorder.actions[loginRequestAt]).toEqual(loginRequest({ resume: RESUME_TOKEN }, false));
		expect(resumedUser()).toEqual(expect.objectContaining({ id: USER_ID, token: RESUME_TOKEN, username: 'the-user' }));

		expect(dropped.readyState).toBe(CLOSED);
		expect(mockTransport.frames({ msg: 'connect' }, reopened).length).toBeGreaterThan(0);
	});

	it('keeps the live connection instead of paying for an avoidable reconnect when switching straight back', async () => {
		bootApp();
		const alive = await openSignedInSocket();
		await subscribeToRoom(ROOM_ID);
		const pingsBefore = pingsOn(alive);
		const connectFramesBefore = mockTransport.frames({ msg: 'connect' }, alive).length;
		recorder.reset();
		const presence = trackCalls(jest.mocked(setUserPresenceOnline));

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await presence.awaitCall();

		expect(pingsOn(alive)).toBeGreaterThan(pingsBefore);
		expect(mockTransport.connections).toHaveLength(1);
		expect(mockTransport.frames({ msg: 'connect' }, alive)).toHaveLength(connectFramesBefore);
		expect(recorder.types()).not.toContain(connectSuccess().type);
		expect(recorder.types()).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});

	it('leaves the socket alone when the app returns to the foreground before anyone is signed in', async () => {
		bootApp();
		const frozen = await openSocket();
		mockTransport.withhold({ msg: 'ping' });
		recorder.reset();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await jest.advanceTimersByTimeAsync(ROUND_TRIP_BUDGET);

		expect(pingsOn(frozen)).toBe(0);
		expect(mockTransport.connections).toHaveLength(1);
		expect(recorder.types()).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});

	it('leaves the socket alone when the app returns to the foreground on the Outside Stack', async () => {
		bootApp();
		const frozen = await openSignedInSocket();
		mockTransport.withhold({ msg: 'ping' });
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await recorder.awaitAction(appStart({ root: RootEnum.ROOT_OUTSIDE }).type);
		const pingsBefore = pingsOn(frozen);
		recorder.reset();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await jest.advanceTimersByTimeAsync(ROUND_TRIP_BUDGET);

		expect(pingsOn(frozen)).toBe(pingsBefore);
		expect(mockTransport.connections).toHaveLength(1);
		expect(recorder.types()).not.toContain(loginRequest({ resume: RESUME_TOKEN }, false).type);
	});

	it('saves the local authentication session and goes away when the app leaves for the background', async () => {
		bootApp();
		await openSignedInSocket();
		const savedSessions = trackCalls(jest.mocked(saveLastLocalAuthenticationSession));

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await savedSessions.awaitCall();

		expect(saveLastLocalAuthenticationSession).toHaveBeenCalledWith(SERVER);
		expect(setUserPresenceAway).toHaveBeenCalled();
	});

	it('stays quiet on the background transition when nobody is signed in', async () => {
		bootApp();
		await openSocket();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await jest.advanceTimersByTimeAsync(0);

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});

	it('stays quiet on the background transition while the socket is down', async () => {
		bootApp();
		await openSignedInSocket();
		store.dispatch(disconnect());
		await recorder.awaitAction(disconnect().type);

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await jest.advanceTimersByTimeAsync(0);

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});

	it('stays quiet on the background transition while on the Outside Stack', async () => {
		bootApp();
		await openSignedInSocket();
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await recorder.awaitAction(appStart({ root: RootEnum.ROOT_OUTSIDE }).type);

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await jest.advanceTimersByTimeAsync(0);

		expect(saveLastLocalAuthenticationSession).not.toHaveBeenCalled();
		expect(setUserPresenceAway).not.toHaveBeenCalled();
	});
});
