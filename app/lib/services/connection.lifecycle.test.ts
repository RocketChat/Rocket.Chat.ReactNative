/**
 * CONNECTION-LIFECYCLE REGRESSION SUITE.
 *
 * Guards the production behavior where an open room silently stops receiving OTHER users'
 * `stream-room-messages` over the websocket after a reconnect, while the user's own REST sends keep
 * working, and only a brand-new SDK instance heals it. Each scenario drives a realistic reconnect
 * sequence through the REAL code:
 *   - REAL sdk wrapper                 app/lib/services/sdk.ts
 *   - REAL connect() app listeners     app/lib/services/connectionListeners.ts (createConnected/CloseListener)
 *   - REAL DDPDriver + Socket          node_modules/@rocket.chat/sdk/lib/drivers/ddp.ts (app-patched)
 *   - REAL RoomSubscription            app/lib/methods/subscriptions/room.ts
 *   - REAL redux store/reducers        meteor(connect)/login/room -> real meteor.connected transitions
 *
 * Modeled seams (documented, faithful to the causal chain, NOT product code executed verbatim):
 *   1. Network: the Socket's `connection` is a fake in-memory transport wired to a FakeServer.
 *      The FakeServer tracks which streams are actually subscribed on the LIVE connection and
 *      only delivers a room push when a matching sub exists — encoding "the server does not push
 *      to a client that never (re)subscribed". A (re)open resets server-side subs (new TCP conn).
 *   2. Login pipeline: production turns the connectedListener's `loginRequest` into `sdk.login` ->
 *      `Socket.emit('login')` via redux-saga. Here a tiny store subscriber does the same: on a
 *      LOGIN.REQUEST edge it emits 'login' on the CURRENT instance's socket and dispatches
 *      LOGIN.SUCCESS. Binding the real saga would drag the whole side-effect tree; the causal edge
 *      (LOGIN.REQUEST -> Socket 'login' on the current instance) is what these scenarios exercise.
 *      (Socket.login's subscribeAll is intentionally omitted: after forceReopen wipes
 *      `this.subscriptions` it re-sends nothing, so room recovery rides entirely on the app-layer
 *      restore re-subscribe — which this preserves.)
 *
 * The connect() `connected`/`close` listeners are NO LONGER modeled: `registerAppListeners` binds
 * the REAL `createConnectedListener`/`createCloseListener` factories that production `connect()`
 * calls, so the recovery dispatch (connectSuccess + resume loginRequest on every 'connected') is
 * exercised as shipping code. `harnessConnect` reproduces connect.ts's instance-swap + listener-rebind
 * (sdk.disconnect -> sdk.initialize -> re-register).
 *
 * Delivery verdict per scenario: was RoomSubscription.handleMessageReceived invoked for the push?
 * GREEN = chain recovered, message delivered. RED = repro (message lost).
 *
 * Scenario f asserts the fresh-instance re-home: after an SDK swap the owner's 'login' fan-out runs
 * RoomSubscription.restore, which re-homes the stream listeners onto the new instance and re-subscribes.
 */

import EJSON from 'ejson';

import { initStore } from '../store/auxStore';
import * as types from '../../actions/actionsTypes';
import { connectSuccess } from '../../actions/connect';

// --- Use the REAL DDP Socket/driver instead of the empty global mock. ---------
jest.mock('@rocket.chat/sdk', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { DDPDriver } = jest.requireActual('@rocket.chat/sdk/lib/drivers/ddp');
	const silentLogger = { debug: () => {}, info: () => {}, error: () => {}, warn: () => {} };

	// Every socket the suite creates, so leaked DDP ping/reopen timers can be cleared on teardown.
	const openSockets: any[] = [];

	// Tracks the streams the server currently considers subscribed on the LIVE connection.
	class FakeServer {
		activeSubs: Set<string>;
		socket: any;
		constructor(socket: any) {
			this.socket = socket;
			this.activeSubs = new Set();
		}
		private deliver(obj: any) {
			// async so the Socket's `once(id)` response listener is registered before the reply lands
			queueMicrotask(() => this.socket.onMessage({ data: JSON.stringify(obj) }));
		}
		handleOutgoing(raw: string) {
			let data: any;
			try {
				data = JSON.parse(raw);
			} catch {
				return;
			}
			if (data.msg === 'connect') return this.deliver({ msg: 'connected', session: 'sess-1' });
			if (data.msg === 'ping') return this.deliver({ msg: 'pong' });
			if (data.msg === 'sub') {
				this.activeSubs.add(`${data.name}::${JSON.stringify(data.params?.[0])}`);
				return this.deliver({ msg: 'ready', subs: [data.id] });
			}
			if (data.msg === 'unsub') return this.deliver({ msg: 'result', id: data.id, result: true });
			if (data.msg === 'method') return this.deliver({ msg: 'result', id: data.id, result: {} });
		}
		hasRoomSub(rid: string) {
			return this.activeSubs.has(`stream-room-messages::${JSON.stringify(rid)}`);
		}
		reset() {
			this.activeSubs.clear();
		}
	}

	const installConnection = (socket: any, server: FakeServer) => {
		socket.connection = {
			send: (raw: string) => server.handleOutgoing(raw),
			close: () => {},
			readyState: 1,
			onopen: () => {},
			onmessage: () => {},
			onerror: () => {},
			onclose: () => {}
		};
		socket.lastPing = Date.now();
	};

	class FakeRocketchat {
		driver: any;
		socket: any;
		server: FakeServer;
		host: string;
		constructor(opts: any) {
			this.host = opts.host;
			this.driver = new DDPDriver({ host: opts.host, logger: silentLogger });
			this.socket = this.driver.ddp;
			this.server = new FakeServer(this.socket);
			installConnection(this.socket, this.server);
			openSockets.push(this.socket);
			// Stub the real websocket open(): install a fresh in-memory connection and reset
			// server-side subs (a new connection = the server has no subs until the client re-subs).
			// eslint-disable-next-line require-await
			this.socket.open = jest.fn(async () => {
				installConnection(this.socket, this.server);
				this.server.reset();
				this.socket.emit('open');
			});
		}
		// wrapper (sdk.ts) delegates these to `current`
		onStreamData(...args: any[]) {
			return this.driver.onStreamData(...args);
		}
		subscribe(...args: any[]) {
			return this.driver.subscribe(...args);
		}
		subscribeRaw(...args: any[]) {
			return this.driver.subscribeRaw(...args);
		}
		unsubscribe(sub: any) {
			return this.driver.unsubscribe(sub);
		}
		checkAndReopen() {
			return this.driver.checkAndReopen();
		}
		connect() {
			return Promise.resolve(this.driver);
		}
		disconnect() {
			return Promise.resolve();
		}
		abort() {}
		get client() {
			return { host: this.host };
		}
	}

	// `__openSockets` is a test-teardown handle for the leaked-timer cleanup, not product surface.
	return { __esModule: true, Rocketchat: FakeRocketchat, settings: {}, __openSockets: openSockets };
});

// --- Neutralize heavy/native leaves reached by RoomSubscription (not the chain under test). ---
jest.mock('../encryption', () => ({
	Encryption: {
		decryptMessage: jest.fn((msg: unknown) => Promise.resolve(msg)),
		decryptPendingSubscriptions: jest.fn(),
		decryptPendingMessages: jest.fn(),
		getRoomInstance: jest.fn(),
		stopRoom: jest.fn()
	}
}));
jest.mock('../methods/loadMissedMessages', () => ({ loadMissedMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../methods/readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../methods/helpers/markMessagesRead', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../database/services/Message', () => ({ getMessageById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../database/services/Thread', () => ({ getThreadById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../database/services/ThreadMessage', () => ({ getThreadMessageById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../database', () => {
	const model = { prepareCreate: jest.fn(() => ({})), prepareUpdate: jest.fn(() => ({})), schema: {} };
	return {
		__esModule: true,
		default: {
			setActiveDB: jest.fn(),
			active: {
				get: () => model,
				write: jest.fn((cb: () => Promise<void>) => cb()),
				batch: jest.fn(() => Promise.resolve())
			}
		}
	};
});
jest.mock('./twoFactor', () => ({ twoFactor: jest.fn() }));

// Imported AFTER mocks so they bind the real sdk wrapper + mocked leaves.
/* eslint-disable import/first, import/order */
import { combineReducers, createStore, type Store } from 'redux';
import * as ddpSdk from '@rocket.chat/sdk';
import RoomSubscription from '../methods/subscriptions/room';
import sdk from './sdk';
import { createConnectedListener, createCloseListener } from './connectionListeners';
import { bindStreamRestoration, registerStreamRestorer } from './connectionRestore';
import connectReducer from '../../reducers/connect';
import loginReducer from '../../reducers/login';
import roomReducer from '../../reducers/room';
/* eslint-enable import/first, import/order */

const SERVER = 'https://open.rocket.chat';
const RID = 'GENERAL';
const USER = { id: 'u-me', username: 'me', token: 'resume-token' };

// Emit the scenario verdict as a single stable line so the pass/fail matrix is read directly
// from stdout (no snapshot indirection).
const report = (scenario: string, verdict: Record<string, unknown>) => {
	// eslint-disable-next-line no-console
	console.log(`VERDICT ${scenario} ${JSON.stringify(verdict)}`);
};

const flush = async (n = 12) => {
	for (let i = 0; i < n; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

type Instance = { socket: any; server: any };
const currentInstance = (): Instance => sdk.current as unknown as Instance;

// Only the slices these scenarios read directly; the real reducers own the full shape.
interface HarnessState {
	meteor: { connected: boolean };
	login: { isFetching: boolean; isAuthenticated: boolean; user?: { token?: string } };
	room: unknown;
	server: { version: string };
	settings: Record<string, unknown>;
}

let store: Store<HarnessState>;

function buildStore(): Store<HarnessState> {
	const reducer = combineReducers({
		meteor: connectReducer,
		login: loginReducer,
		room: roomReducer,
		// static slices RoomSubscription / wrapper read
		server: (s = { version: '6.0.0' }) => s,
		settings: (s = {}) => s
	});
	return createStore(reducer as any) as Store<HarnessState>;
}

// Models the redux-saga login pipeline: a LOGIN.REQUEST (dispatched by the connectedListener guard)
// completes into Socket 'login' + LOGIN.SUCCESS. Emits on the CURRENT instance's socket, which is
// exactly why a fresh instance (scenario f) strands a RoomSubscription bound to the old socket.
// 'fail' models the resume login terminally failing on a transient (non-401) error: no 'login' emit,
// no subscribeAll, meteor untouched. The saga's own bounded retry/backoff lives outside this harness,
// so this mode stands in for the outcome after retries are exhausted.
let loginPipelineMode: 'success' | 'fail' = 'success';
function installLoginPipeline() {
	let prevFetching = store.getState().login.isFetching;
	store.subscribe(() => {
		const { isFetching } = store.getState().login;
		if (isFetching && !prevFetching) {
			queueMicrotask(() => {
				if (loginPipelineMode === 'fail') {
					store.dispatch({ type: types.LOGIN.FAILURE, err: { message: 'transient network error' } } as any);
					return;
				}
				currentInstance()?.socket?.emit('login', { token: USER.token });
				store.dispatch({ type: types.LOGIN.SUCCESS, user: USER } as any);
			});
		}
		prevFetching = isFetching;
	});
}

// Binds the REAL connect.ts app listeners (createConnectedListener/createCloseListener) against the
// harness store, so the `meteor.connected` guard is the shipping code. logoutOnError=false mirrors a
// resume connect(). `unsubscribeRooms` is a no-op test double: the rooms-LIST subscription is out of
// scope for this room-message delivery chain — only the guard/dispatch logic matters here.
let connectedListener: any;
let closeListener: any;
let restoreListener: any;
function registerAppListeners() {
	connectedListener = sdk.onStreamData('connected', createConnectedListener(false));
	closeListener = sdk.onStreamData('close', createCloseListener({}));
	restoreListener = bindStreamRestoration();
}

// connect.ts's instance swap + listener rebind (connect.ts:58,103,119-143), minus peripheral wiring.
async function harnessConnect() {
	if (connectedListener) (await connectedListener)?.stop?.();
	if (closeListener) (await closeListener)?.stop?.();
	if (restoreListener) (await restoreListener)?.stop?.();
	sdk.disconnect();
	sdk.initialize(SERVER);
	registerAppListeners();
	await flush();
}

const fireConnected = (inst: Instance = currentInstance()) =>
	inst.socket.onMessage({ data: JSON.stringify({ msg: 'connected', session: 'sess-1' }) });

const fireClose = (inst: Instance = currentInstance(), code = 1006) => inst.socket.onClose({ code });

const encodedMessage = (rid: string) => ({
	_id: `msg-${Math.random().toString(36).slice(2)}`,
	rid,
	msg: 'hi from another user',
	ts: { $date: Date.now() },
	u: { _id: 'u-other', username: 'other' },
	_updatedAt: { $date: Date.now() }
});

// Attempts a server push of a room message on the given instance. The server only delivers when it
// currently holds a sub for the room on the live connection (mirrors production).
function pushRoomMessage(rid: string, inst: Instance = currentInstance()) {
	const serverHadSub = inst.server.hasRoomSub(rid);
	if (serverHadSub) {
		inst.socket.onMessage({
			data: JSON.stringify({
				msg: 'changed',
				collection: 'stream-room-messages',
				fields: { eventName: rid, args: [EJSON.toJSONValue(encodedMessage(rid))] }
			})
		});
	}
	return { serverHadSub };
}

const listenerCount = (inst: Instance, event: string) => inst.socket._listeners?.[event]?.length ?? 0;

// RoomSubscriptions created by the harness. Their restorers live in the module-global registry, so
// afterEach unsubscribes them to keep a dead sub's restorer from firing on the next test's login.
const createdSubs: RoomSubscription[] = [];

// Establishes a logged-in session with the room open and its stream-room-messages sub live.
async function openRoomSession() {
	await harnessConnect();
	fireConnected();
	await flush(); // connected -> guard -> loginRequest -> (pipeline) login + LOGIN.SUCCESS

	const sub = new RoomSubscription(RID);
	createdSubs.push(sub);
	const received = jest.fn(sub.handleMessageReceived);
	sub.handleMessageReceived = received; // spy BEFORE subscribe so the emitter binds the spy
	await sub.subscribe();
	await flush(); // let the 5 stream subs ack on the server

	return { sub, received, subscribedInstance: currentInstance() };
}

describe('connection lifecycle — room message delivery across reconnects', () => {
	beforeEach(() => {
		store = buildStore();
		initStore(store);
		loginPipelineMode = 'success';
		installLoginPipeline();
		// seed an authenticated session (user has a resume token)
		store.dispatch({ type: types.LOGIN.SUCCESS, user: USER } as any);
		connectedListener = undefined;
		closeListener = undefined;
		restoreListener = undefined;
	});

	afterEach(async () => {
		// Dispose harness subs so their registry restorers don't leak into the next test.
		await Promise.all(createdSubs.map(sub => sub.unsubscribe().catch(() => {})));
		createdSubs.length = 0;
		// The real DDPDriver schedules ping/reopen timers on every socket (via ping()/reopen()) that
		// never fire because scenarios don't advance time. Clear them so Jest exits without an
		// open-handle warning. Test-only teardown — no production change.
		(ddpSdk as any).__openSockets.forEach((socket: any) => {
			if (socket.pingTimeout) clearTimeout(socket.pingTimeout);
			if (socket.openTimeout) clearTimeout(socket.openTimeout);
		});
		(ddpSdk as any).__openSockets.length = 0;
	});

	it('a. baseline: message delivered on a healthy subscribed room (harness sanity)', async () => {
		const { received, subscribedInstance } = await openRoomSession();

		const { serverHadSub } = pushRoomMessage(RID, subscribedInstance);
		await flush();

		report('a', { serverHadSub, delivered: received.mock.calls.length > 0 });
		expect(serverHadSub).toBe(true);
		expect(received).toHaveBeenCalledTimes(1);
	});

	it('b. plain network flap: close(1006) -> reopen -> connected -> login resume', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		fireClose(subscribedInstance, 1006); // real onClose: emits close, schedules reopen (code !== 4000)
		await flush();
		await subscribedInstance.socket.open(); // stand in for the scheduled reopen firing
		await flush();
		fireConnected(subscribedInstance);
		await flush(); // guard -> loginRequest -> login -> restore re-subscribes

		const { serverHadSub } = pushRoomMessage(RID, subscribedInstance);
		await flush();

		report('b', { serverHadSub, delivered: received.mock.calls.length > 0 });
		expect({ serverHadSub, delivered: received.mock.calls.length > 0 }).toEqual({ serverHadSub: true, delivered: true });
	});

	it('c. foreground forceReopen (checkAndReopen stale bucket) -> connected -> login', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		// Foreground path: stale socket -> checkAndReopen -> forceReopen (emits close 4000, wipes subs, reopens)
		subscribedInstance.socket.lastPing = 0;
		await subscribedInstance.socket.checkAndReopen();
		await flush();
		fireConnected(subscribedInstance);
		await flush();

		const { serverHadSub } = pushRoomMessage(RID, subscribedInstance);
		await flush();

		report('c', { serverHadSub, delivered: received.mock.calls.length > 0 });
		expect({ serverHadSub, delivered: received.mock.calls.length > 0 }).toEqual({ serverHadSub: true, delivered: true });
	});

	it('d. forceReopen while redux still reads connected=true must still recover', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		await subscribedInstance.socket.forceReopen(); // emits close(4000) -> disconnect dispatched
		await flush();
		// Race: a connectSuccess lands (or the close disconnect never did) so redux reads connected=true
		// at the moment 'connected' fires. Recovery must run regardless.
		store.dispatch(connectSuccess());
		fireConnected(subscribedInstance);
		await flush();

		const { serverHadSub } = pushRoomMessage(RID, subscribedInstance);
		await flush();

		report('d', {
			serverHadSub,
			delivered: received.mock.calls.length > 0,
			listenerOnSocket: listenerCount(subscribedInstance, 'stream-room-messages')
		});
		// A stale connected=true no longer short-circuits recovery: 'connected' -> loginRequest ->
		// restore re-subscribes, the server holds the room sub, and other users' messages arrive.
		expect(received.mock.calls.length).toBeGreaterThan(0);
		expect(serverHadSub).toBe(true);
	});

	it('e. overlapping reconnect: forceReopen fires again mid-recovery (before login completes)', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		await subscribedInstance.socket.forceReopen();
		fireConnected(subscribedInstance); // starts recovery (loginRequest queued)
		// second forceReopen before restore's re-subscribe settles
		await subscribedInstance.socket.forceReopen();
		await flush();
		fireConnected(subscribedInstance);
		await flush();

		const { serverHadSub } = pushRoomMessage(RID, subscribedInstance);
		await flush();

		report('e', {
			serverHadSub,
			delivered: received.mock.calls.length > 0,
			listenerOnSocket: listenerCount(subscribedInstance, 'stream-room-messages')
		});
		// Recovers: the final connected -> loginRequest -> restore re-subscribe wins.
		expect(received.mock.calls.length).toBeGreaterThan(0);
	});

	it('f. a new SDK instance while RoomSubscription stays mounted must keep delivering', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		// connect() re-runs for the same server -> brand-new instance/socket, listeners rebound to it.
		const generationBefore = sdk.generation;
		await harnessConnect();
		const freshInstance = currentInstance();
		expect(freshInstance).not.toBe(subscribedInstance);
		// The instance swap bumps the SDK generation id; CR-4 will key stream restoration to it.
		expect(sdk.generation).toBe(generationBefore + 1);

		fireConnected(freshInstance);
		await flush(); // fresh socket logs in

		const onNew = pushRoomMessage(RID, freshInstance);
		const deliveredOnNew = received.mock.calls.length > 0;
		const onOld = pushRoomMessage(RID, subscribedInstance);
		const deliveredOnOld = received.mock.calls.length > 0;
		await flush();

		report('f', {
			deliveredOnNewLiveSocket: deliveredOnNew,
			deliveredOnOldDeadSocket: deliveredOnOld,
			listenerOnOldSocket: listenerCount(subscribedInstance, 'stream-room-messages'),
			listenerOnNewSocket: listenerCount(freshInstance, 'stream-room-messages'),
			oldServerHadSub: onOld.serverHadSub,
			newServerHadSub: onNew.serverHadSub
		});
		// After connect() swaps to a fresh socket, the owner's 'login' fan-out runs RoomSubscription's
		// restore, which re-homes stream-room-messages onto the new instance and re-sends the room sub,
		// so real pushes on the new live socket are delivered.
		expect(deliveredOnNew).toBe(true);
		expect(listenerCount(freshInstance, 'stream-room-messages')).toBeGreaterThan(0);
		expect(onNew.serverHadSub).toBe(true);
	});

	it('g. after a transient resume-login failure, a later connected re-runs recovery', async () => {
		const { received, subscribedInstance } = await openRoomSession();
		received.mockClear();

		// Foreground after silent socket death: checkAndReopen -> forceReopen.
		// close(4000) -> meteor=false, DDP subs wiped; resume login then hits a transient error.
		subscribedInstance.socket.lastPing = 0;
		loginPipelineMode = 'fail';
		await subscribedInstance.socket.checkAndReopen();
		await flush();
		fireConnected(subscribedInstance); // connectSuccess(meteor=TRUE) -> loginRequest -> FAILS
		await flush();

		// Transient failure strands the session: socket reads connected, but the resume login failed so
		// there is no authenticated session and no server-side sub yet.
		const strandedState = {
			meteorConnected: store.getState().meteor.connected,
			isAuthenticated: store.getState().login.isAuthenticated
		};
		const push1 = pushRoomMessage(RID, subscribedInstance);
		await flush();
		const deliveredAfterFailure = received.mock.calls.length > 0;

		// Login now succeeds; a later 'connected' (no intervening close) must re-run recovery.
		loginPipelineMode = 'success';
		fireConnected(subscribedInstance);
		await flush();
		pushRoomMessage(RID, subscribedInstance);
		await flush();
		const deliveredAfterSecondConnected = received.mock.calls.length > 0;

		report('g', {
			strandedState,
			serverHadSubAfterFailure: push1.serverHadSub,
			deliveredAfterFailure,
			deliveredAfterSecondConnected
		});
		// After a transient resume-login failure, a later 'connected' (login now healthy) re-runs recovery
		// and re-subscribes the room WITHOUT needing a real transport close. The stranded state heals as
		// soon as the next 'connected' arrives.
		expect(strandedState).toEqual({ meteorConnected: true, isAuthenticated: false });
		expect(deliveredAfterFailure).toBe(false);
		expect(deliveredAfterSecondConnected).toBe(true);
	});

	it('h. the owner fans out to an enrolled restorer once per connect+login and drops stale generations', async () => {
		const spy = jest.fn();
		const dispose = registerStreamRestorer(spy);
		try {
			await harnessConnect(); // fresh owner bound on the current generation

			fireConnected(); // connected -> loginRequest -> login -> fan-out (run #1)
			await flush();
			expect(spy).toHaveBeenCalledTimes(1);

			fireConnected(); // a later connected re-runs login -> fan-out (run #2), no close needed
			await flush();
			expect(spy).toHaveBeenCalledTimes(2);

			// Generation guard: an owner from a superseded connect() that outlived its generation must NOT
			// fan out. Bind an owner, then swap the SDK instance WITHOUT stopping it, and fire the old
			// socket's 'login' — the captured generation no longer matches, so no restorer runs.
			const strandedInstance = currentInstance();
			await bindStreamRestoration();
			sdk.disconnect();
			sdk.initialize(SERVER);
			spy.mockClear();
			strandedInstance.socket.emit('login', { token: USER.token });
			await flush();
			expect(spy).not.toHaveBeenCalled();
		} finally {
			dispose();
		}
	});
});
