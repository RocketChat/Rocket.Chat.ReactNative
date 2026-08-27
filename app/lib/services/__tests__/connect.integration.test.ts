jest.unmock('@rocket.chat/sdk');

import type { AnyAction, Store } from 'redux';

import { connect, login, loginWithPassword } from '../connect';
import sdk from '../sdk';
import { initStore } from '../../store/auxStore';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../../actions/connect';
import { loginRequest, logout, setUser } from '../../../actions/login';
import { setActiveUsers } from '../../../actions/activeUsers';
import { updateSettings } from '../../../actions/settings';
import { updatePermission } from '../../../actions/permissions';
import { _activeUsers, _setUserTimer } from '../../methods/setUser';
import { makeCollection } from '../../testUtils/appMocks';
import { createActionRecorder, trackCalls } from '../../testUtils/observedEffects';
import { createTransportFake } from '../../testUtils/sdkTransport';
import type { IApplicationState } from '../../../definitions';

const ROUND_TRIP_BUDGET = 2000;

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

jest.mock('../voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		reset: jest.fn(),
		drainPendingHangups: jest.fn()
	}
}));

jest.mock('../twoFactor/twoFactor', () => ({
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

interface IHarnessState {
	meteor: { connected: boolean };
	login: { user: Record<string, unknown> | null; isAuthenticated: boolean };
	server: { version: string };
	settings: Record<string, unknown>;
	room: { subscribedRoom: string | null };
}

const recorder = createActionRecorder();

let state: IHarnessState;
let store: Store<IApplicationState> & { dispatch: jest.Mock };
let collections: Record<string, ReturnType<typeof makeCollection>>;

function makeStore(): void {
	state = {
		meteor: { connected: false },
		login: { user: null, isAuthenticated: false },
		server: { version: '5.0.0' },
		settings: {},
		room: { subscribedRoom: null }
	};
	store = {
		getState: () => state,
		dispatch: jest.fn((action: AnyAction) => {
			recorder.record(action);
			return action;
		}),
		subscribe: () => () => undefined
	} as unknown as Store<IApplicationState> & { dispatch: jest.Mock };
}

beforeEach(() => {
	jest.clearAllMocks();
	mockTransport.reset();
	recorder.reset();
	collections = {};
	makeStore();
	initStore(store);
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
	sdk.disconnect();
	if (_setUserTimer.setUserTimer) clearTimeout(_setUserTimer.setUserTimer);
	_setUserTimer.setUserTimer = null;
});

async function connectAndDriveHandshake(server = 'https://example.com') {
	const index = mockTransport.connections.length;
	const connecting = connect({ server });
	mockTransport.open(await mockTransport.awaitConnection(index));
	await connecting;
	await recorder.awaitAction(connectSuccess().type);
	state.meteor.connected = true;
}

describe('connect() over the real SDK', () => {
	it('dispatches connectRequest when connecting and connectSuccess once on the handshake', async () => {
		await connectAndDriveHandshake();

		expect(store.dispatch).toHaveBeenCalledWith(connectRequest());
		expect(store.dispatch).toHaveBeenCalledWith(connectSuccess());
		expect(recorder.actionsOfType(connectSuccess().type)).toHaveLength(1);
	});

	it('ignores a repeated connected frame after the first', async () => {
		await connectAndDriveHandshake();

		mockTransport.deliver({ msg: 'connected', session: 'again' });
		await expect(sdk.driver?.probe(ROUND_TRIP_BUDGET)).resolves.toBe(true);

		expect(recorder.actionsOfType(connectSuccess().type)).toHaveLength(1);
	});

	it('dispatches disconnect when the socket closes', async () => {
		await connectAndDriveHandshake();

		mockTransport.closeTransport();

		await expect(recorder.awaitAction(disconnectAction().type)).resolves.toEqual(disconnectAction());
	});

	it('resumes login with the stored token once connected', async () => {
		state.login.user = { token: 'stored-token' };

		await connectAndDriveHandshake();

		expect(recorder.requireAction(loginRequest({}, false).type)).toEqual(loginRequest({ resume: 'stored-token' }, false));
	});

	it('tears down the prior connection and stops its listeners when connect() is re-run', async () => {
		await connectAndDriveHandshake('https://a.example.com');
		const firstConnection = mockTransport.connections[0];
		const successBefore = recorder.actionsOfType(connectSuccess().type).length;
		state.meteor.connected = false;

		const reconnecting = connect({ server: 'https://b.example.com' });
		await mockTransport.awaitConnection(1);
		await reconnecting;

		expect(firstConnection.readyState).toBe(3);

		mockTransport.deliver({ msg: 'connected', session: 'x' }, firstConnection);
		mockTransport.open(mockTransport.connections[1]);
		await recorder.awaitAction(connectSuccess().type);

		expect(recorder.actionsOfType(connectSuccess().type)).toHaveLength(successBefore + 1);
	});
});

describe('login() over the real SDK', () => {
	it('maps the server login result to the logged user', async () => {
		await connectAndDriveHandshake();

		const user = await login({ user: 'the-user', password: 'secret' });

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
		await connectAndDriveHandshake();

		const user = await login({ user: 'the-user', password: 'secret' });

		expect(user).toEqual(
			expect.objectContaining({
				enableMessageParserEarlyAdoption: true,
				showMessageInMainThread: false
			})
		);
	});

	it('reads the parser/main-thread preferences from the server below 5.0.0', async () => {
		state.server.version = '4.9.0';
		(REST_LOGIN_ME.settings.preferences as Record<string, unknown>).enableMessageParserEarlyAdoption = false;
		(REST_LOGIN_ME.settings.preferences as Record<string, unknown>).showMessageInMainThread = true;

		await connectAndDriveHandshake();

		const user = await login({ user: 'the-user', password: 'secret' });

		expect(user).toEqual(
			expect.objectContaining({
				enableMessageParserEarlyAdoption: false,
				showMessageInMainThread: true
			})
		);
	});

	it('sends LDAP params on the wire when LDAP is enabled', async () => {
		state.settings.LDAP_Enable = true;
		await connectAndDriveHandshake();

		await loginWithPassword({ user: 'the-user', password: 'secret' });

		const loginCall = (global.fetch as jest.Mock).mock.calls.find(([url]) => String(url).includes('/api/v1/login'));
		const body = JSON.parse(loginCall[1].body);
		expect(body).toEqual(expect.objectContaining({ username: 'the-user', ldapPass: 'secret', ldap: true }));
	});

	it('sends CROWD params on the wire when CROWD is enabled', async () => {
		state.settings.CROWD_Enable = true;
		await connectAndDriveHandshake();

		await loginWithPassword({ user: 'the-user', password: 'secret' });

		const loginCall = (global.fetch as jest.Mock).mock.calls.find(([url]) => String(url).includes('/api/v1/login'));
		const body = JSON.parse(loginCall[1].body);
		expect(body).toEqual(expect.objectContaining({ username: 'the-user', crowdPassword: 'secret', crowd: true }));
	});
});

describe('onStreamData handlers over real frames', () => {
	it('public-settings-changed dispatches updateSettings', async () => {
		await connectAndDriveHandshake();
		database.active.get('settings').find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-notify-all',
			fields: { eventName: 'public-settings-changed', args: [null, { _id: 'Site_Name', value: 'New Name' }] }
		});

		await expect(recorder.awaitAction(updateSettings('Site_Name', 'New Name').type)).resolves.toEqual(
			updateSettings('Site_Name', 'New Name')
		);
	});

	it('stream-user-presence sets the active user and the logged user', async () => {
		state.login.user = { id: 'user-id' };
		await connectAndDriveHandshake();

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-user-presence',
			fields: { uid: 'user-id', args: [['user-id', 1, '', '', undefined]] }
		});
		await recorder.awaitAction(setUser({}).type);

		expect(store.dispatch).toHaveBeenCalledWith(setActiveUsers({ 'user-id': expect.objectContaining({ status: 'online' }) }));
		expect(store.dispatch).toHaveBeenCalledWith(setUser(expect.objectContaining({ status: 'online' })));
	});

	it('user-status batches into _activeUsers and sets the logged user', async () => {
		state.login.user = { id: 'user-id' };
		await connectAndDriveHandshake();

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'user-status', args: [['user-id', 'online', 1, '', '', undefined]] }
		});
		await recorder.awaitAction(setUser({}).type);

		expect(_activeUsers.activeUsers['user-id']).toEqual(expect.objectContaining({ status: 'online' }));
		expect(store.dispatch).toHaveBeenCalledWith(setUser(expect.objectContaining({ status: 'online' })));
	});

	it('permissions-changed dispatches updatePermission', async () => {
		await connectAndDriveHandshake();
		database.active.get('permissions').find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'permissions-changed', args: [null, { _id: 'create-c', roles: ['admin'] }] }
		});

		await expect(recorder.awaitAction(updatePermission('create-c', ['admin']).type)).resolves.toEqual(
			updatePermission('create-c', ['admin'])
		);
	});

	it('Users:NameChanged upserts the user in the database', async () => {
		await connectAndDriveHandshake();
		const collection = database.active.get('users');
		collection.find.mockResolvedValue({ update: jest.fn(async (fn: (u: unknown) => void) => fn({})) });
		const writes = trackCalls(database.active.write);

		mockTransport.deliver({
			msg: 'changed',
			collection: 'stream-notify-logged',
			fields: { eventName: 'Users:NameChanged', args: [{ _id: 'user-id', username: 'renamed' }] }
		});
		await writes.awaitCall();

		expect(collection.find).toHaveBeenCalledWith('user-id');
	});

	it('stream-force_logout dispatches logout(true)', async () => {
		await connectAndDriveHandshake();

		mockTransport.deliver({ msg: 'changed', collection: 'stream-force_logout', fields: {} });

		await expect(recorder.awaitAction(logout(true).type)).resolves.toEqual(logout(true));
	});

	it('users frame feeds _setUser', async () => {
		await connectAndDriveHandshake();

		mockTransport.deliver({
			msg: 'added',
			collection: 'users',
			id: 'user-id',
			fields: { username: 'the-user', status: 'online' }
		});

		expect(_activeUsers.activeUsers['user-id']).toEqual(expect.objectContaining({ status: 'online' }));
	});
});

describe('sdk.subscribeRoom() over the real SDK', () => {
	it('subscribes to the room streams for servers >= 4.0.0', async () => {
		state.server.version = '5.0.0';
		await connectAndDriveHandshake();

		await sdk.subscribeRoom('room-rid');

		const subs = mockTransport.frames({ msg: 'sub' });
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
		state.server.version = '3.9.0';
		await connectAndDriveHandshake();

		await sdk.subscribeRoom('room-rid');

		expect(mockTransport.frames({ msg: 'sub' })[0].params?.[0]).toBe('room-rid/typing');
	});
});
