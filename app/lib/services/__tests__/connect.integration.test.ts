import type { Store } from 'redux';

jest.unmock('@rocket.chat/sdk');

import { connect, login, loginWithPassword } from '../connect';
import sdk from '../sdk';
import { initStore } from '../../store/auxStore';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../../actions/connect';
import { loginRequest, logout, setUser } from '../../../actions/login';
import { setActiveUsers } from '../../../actions/activeUsers';
import { updateSettings } from '../../../actions/settings';
import { updatePermission } from '../../../actions/permissions';
import { _activeUsers, _setUserTimer } from '../../methods/setUser';
import type { IApplicationState } from '../../../definitions';

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
	method?: string;
	params?: unknown[];
}

const mockConnections: MockConnection[] = [];

const DDP_LOGIN_RESULT = { id: 'user-id', token: 'auth-token' };

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
				} else if (message.msg === 'method' && message.method === 'login') {
					setImmediate(() =>
						connection.onmessage({ data: JSON.stringify({ msg: 'result', id: message.id, result: DDP_LOGIN_RESULT }) })
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

jest.mock('../voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		reset: jest.fn(),
		drainPendingHangups: jest.fn()
	}
}));

jest.mock('../twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: { t: jest.fn((key: string) => key) }
}));

jest.mock('../../methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../database', () => ({
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const database = require('../../database').default as {
	setActiveDB: jest.Mock;
	active: { get: jest.Mock; write: jest.Mock; batch: jest.Mock };
};

const REST_LOGIN_ME = {
	username: 'the-user',
	name: 'The User',
	language: 'en',
	status: 'online',
	statusText: '',
	customFields: { role: 'admin' },
	statusLivechat: 'available',
	emails: [{ address: 'the-user@example.com', verified: true }],
	roles: ['user', 'admin'],
	avatarETag: 'etag-123',
	settings: { preferences: { alsoSendThreadToChannel: 'default' } },
	bio: 'hi',
	nickname: 'nick',
	requirePasswordChange: false
};

function makeReduxStore() {
	const listeners = new Set<() => void>();
	const state = {
		meteor: { connected: false },
		login: { user: null as Record<string, unknown> | null, isAuthenticated: false },
		server: { version: '5.0.0' },
		settings: {} as Record<string, unknown>,
		room: { subscribedRoom: null as string | null }
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
		} as unknown as Store<IApplicationState> & { dispatch: jest.Mock }
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
		prepareCreate: jest.fn(),
		schema: {}
	};
}

let redux: ReturnType<typeof makeReduxStore>;
let collections: Record<string, ReturnType<typeof makeCollection>>;

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockConnections.length = 0;
	collections = {};
	redux = makeReduxStore();
	initStore(redux.store);
	database.setActiveDB.mockReset();
	database.active.get.mockReset().mockImplementation((name: string) => (collections[name] ??= makeCollection(name)));
	database.active.write.mockReset().mockImplementation((fn: () => unknown) => fn());
	database.active.batch.mockReset().mockImplementation((...records: unknown[]) => Promise.resolve(records));
	_activeUsers.activeUsers = {} as never;
	_setUserTimer.setUserTimer = null;
	REST_LOGIN_ME.settings.preferences = { alsoSendThreadToChannel: 'default' };
	global.fetch = jest.fn((url: unknown) => {
		const target = String(url);
		if (target.includes('/api/v1/login')) {
			return Promise.resolve({
				status: 200,
				json: () =>
					Promise.resolve({ status: 'success', data: { userId: 'user-id', authToken: 'auth-token', me: REST_LOGIN_ME } })
			});
		}
		return Promise.resolve({ status: 200, json: () => Promise.resolve({ success: false }) });
	}) as unknown as typeof fetch;
});

afterEach(() => {
	jest.useRealTimers();
});

async function connectAndDriveHandshake(server = 'https://example.com') {
	await connect({ server });
	await flush();
	expect(mockConnections.length).toBeGreaterThan(0);
	mockConnections[0].onopen();
	await flush();
}

describe('connect() over the real SDK', () => {
	it('dispatches connectRequest when connecting and connectSuccess once on the handshake', async () => {
		await connectAndDriveHandshake();

		expect(redux.store.dispatch).toHaveBeenCalledWith(connectRequest());
		expect(redux.store.dispatch).toHaveBeenCalledWith(connectSuccess());
		expect(redux.store.dispatch.mock.calls.filter(([action]) => action.type === connectSuccess().type)).toHaveLength(1);
	});

	it('ignores a repeated connected frame after the first', async () => {
		await connectAndDriveHandshake();
		redux.state.meteor.connected = true;

		receiveFrame(mockConnections[0], { msg: 'connected', session: 'again' });
		await flush();

		expect(redux.store.dispatch.mock.calls.filter(([action]) => action.type === connectSuccess().type)).toHaveLength(1);
	});

	it('dispatches disconnect when the socket closes', async () => {
		await connectAndDriveHandshake();

		mockConnections[0].onclose({ code: 1006 });
		await flush();

		expect(redux.store.dispatch).toHaveBeenCalledWith(disconnectAction());
	});

	it('resumes login with the stored token once connected', async () => {
		redux.state.login.user = { token: 'stored-token' };

		await connectAndDriveHandshake();

		expect(redux.store.dispatch).toHaveBeenCalledWith(loginRequest({ resume: 'stored-token' }, false));
	});

	it('tears down the prior connection and stops its listeners when connect() is re-run', async () => {
		await connectAndDriveHandshake('https://a.example.com');
		const firstConnection = mockConnections[0];
		const successCount = () => redux.store.dispatch.mock.calls.filter(([action]) => action.type === connectSuccess().type).length;
		const before = successCount();

		await connect({ server: 'https://b.example.com' });
		await flush();

		expect(firstConnection.close).toHaveBeenCalled();

		firstConnection.onmessage({ data: JSON.stringify({ msg: 'connected', session: 'x' }) });
		await flush();

		expect(successCount()).toBe(before);
	});
});

describe('login() over the real SDK', () => {
	async function connectLoggedIn() {
		await connectAndDriveHandshake();
	}

	it('maps the server login result to the logged user', async () => {
		await connectLoggedIn();

		const loginPromise = login({ user: 'the-user', password: 'secret' });
		await flush();
		const user = await loginPromise;

		expect(user).toEqual(
			expect.objectContaining({
				id: 'user-id',
				token: 'auth-token',
				username: 'the-user',
				name: 'The User',
				language: 'en',
				status: 'online',
				roles: ['user', 'admin'],
				avatarETag: 'etag-123',
				bio: 'hi',
				nickname: 'nick'
			})
		);
	});

	it('defaults the parser/main-thread preferences on servers >= 5.0.0', async () => {
		await connectLoggedIn();

		const loginPromise = login({ user: 'the-user', password: 'secret' });
		await flush();
		const user = await loginPromise;

		expect(user).toEqual(
			expect.objectContaining({
				enableMessageParserEarlyAdoption: true,
				showMessageInMainThread: false
			})
		);
	});

	it('reads the parser/main-thread preferences from the server below 5.0.0', async () => {
		redux.state.server.version = '4.9.0';
		(REST_LOGIN_ME.settings.preferences as Record<string, unknown>).enableMessageParserEarlyAdoption = false;
		(REST_LOGIN_ME.settings.preferences as Record<string, unknown>).showMessageInMainThread = true;

		await connectLoggedIn();

		const loginPromise = login({ user: 'the-user', password: 'secret' });
		await flush();
		const user = await loginPromise;

		expect(user).toEqual(
			expect.objectContaining({
				enableMessageParserEarlyAdoption: false,
				showMessageInMainThread: true
			})
		);
	});

	it('sends LDAP params on the wire when LDAP is enabled', async () => {
		redux.state.settings.LDAP_Enable = true;
		await connectLoggedIn();

		const loginPromise = loginWithPassword({ user: 'the-user', password: 'secret' });
		await flush();
		await loginPromise;

		const loginCall = (global.fetch as jest.Mock).mock.calls.find(([url]) => String(url).includes('/api/v1/login'));
		const body = JSON.parse(loginCall[1].body);
		expect(body).toEqual(expect.objectContaining({ username: 'the-user', ldapPass: 'secret', ldap: true }));
	});

	it('sends CROWD params on the wire when CROWD is enabled', async () => {
		redux.state.settings.CROWD_Enable = true;
		await connectLoggedIn();

		const loginPromise = loginWithPassword({ user: 'the-user', password: 'secret' });
		await flush();
		await loginPromise;

		const loginCall = (global.fetch as jest.Mock).mock.calls.find(([url]) => String(url).includes('/api/v1/login'));
		const body = JSON.parse(loginCall[1].body);
		expect(body).toEqual(expect.objectContaining({ username: 'the-user', crowdPassword: 'secret', crowd: true }));
	});
});

describe('onStreamData handlers over real frames', () => {
	it('public-settings-changed dispatches updateSettings', async () => {
		await connectAndDriveHandshake();
		database.active.get('settings').find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-notify-all',
			fields: { eventName: 'public-settings-changed', args: [null, { _id: 'Site_Name', value: 'New Name' }] }
		});
		await flush();

		expect(redux.store.dispatch).toHaveBeenCalledWith(updateSettings('Site_Name', 'New Name'));
	});

	it('stream-user-presence sets the active user and the logged user', async () => {
		redux.state.login.user = { id: 'user-id' };
		await connectAndDriveHandshake();

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-user-presence',
			fields: { uid: 'user-id', args: [['user-id', 1, '', '', undefined]] }
		});
		await flush();

		expect(redux.store.dispatch).toHaveBeenCalledWith(
			setActiveUsers({ 'user-id': expect.objectContaining({ status: 'online' }) })
		);
		expect(redux.store.dispatch).toHaveBeenCalledWith(setUser(expect.objectContaining({ status: 'online' })));
	});

	it('user-status batches into _activeUsers and sets the logged user', async () => {
		redux.state.login.user = { id: 'user-id' };
		await connectAndDriveHandshake();

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'user-status', args: [['user-id', 'online', 1, '', '', undefined]] }
		});
		await flush();

		expect(_activeUsers.activeUsers['user-id']).toEqual(expect.objectContaining({ status: 'online' }));
		expect(redux.store.dispatch).toHaveBeenCalledWith(setUser(expect.objectContaining({ status: 'online' })));
	});

	it('permissions-changed dispatches updatePermission', async () => {
		await connectAndDriveHandshake();
		database.active.get('permissions').find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'permissions-changed', args: [null, { _id: 'create-c', roles: ['admin'] }] }
		});
		await flush();

		expect(redux.store.dispatch).toHaveBeenCalledWith(updatePermission('create-c', ['admin']));
	});

	it('Users:NameChanged upserts the user in the database', async () => {
		await connectAndDriveHandshake();
		const collection = database.active.get('users');
		collection.find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });

		receiveFrame(mockConnections[0], {
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'Users:NameChanged', args: [{ _id: 'user-id', username: 'renamed' }] }
		});
		await flush();

		expect(collection.find).toHaveBeenCalledWith('user-id');
		expect(database.active.write).toHaveBeenCalled();
	});

	it('stream-force_logout dispatches logout(true)', async () => {
		await connectAndDriveHandshake();

		receiveFrame(mockConnections[0], { msg: 'changed', collection: 'stream-force_logout', fields: {} });
		await flush();

		expect(redux.store.dispatch).toHaveBeenCalledWith(logout(true));
	});

	it('users frame feeds _setUser', async () => {
		await connectAndDriveHandshake();

		receiveFrame(mockConnections[0], {
			msg: 'added',
			collection: 'users',
			id: 'user-id',
			fields: { username: 'the-user', status: 'online' }
		});
		await flush();

		expect(_activeUsers.activeUsers['user-id']).toEqual(expect.objectContaining({ status: 'online' }));
	});
});

describe('sdk.subscribeRoom() over the real SDK', () => {
	it('subscribes to the room streams for servers >= 4.0.0', async () => {
		redux.state.server.version = '5.0.0';
		await connectAndDriveHandshake();

		const subscribing = sdk.subscribeRoom('room-rid');
		await flush();
		await subscribing;

		const subs = framesOn(mockConnections[0], 'sub');
		expect(subs.map(sub => sub.name)).toEqual([
			'stream-notify-room',
			'stream-room-messages',
			'stream-notify-room',
			'stream-notify-room',
			'stream-notify-room'
		]);
		expect(subs.map(sub => sub.params?.[0])).toEqual([
			'room-rid/user-activity',
			'room-rid',
			'room-rid/deleteMessage',
			'room-rid/deleteMessageBulk',
			'room-rid/messagesRead'
		]);
	});

	it('subscribes to the typing event on servers below 4.0.0', async () => {
		redux.state.server.version = '3.9.0';
		await connectAndDriveHandshake();

		const subscribing = sdk.subscribeRoom('room-rid');
		await flush();
		await subscribing;

		const subs = framesOn(mockConnections[0], 'sub');
		expect(subs[0].params?.[0]).toBe('room-rid/typing');
	});
});
