import '@appduct/react-native/auto';
import { jsonSchema, registerTool } from '@appduct/react-native';
import { Q } from '@nozbe/watermelondb';

import { deepLinkingOpen } from '~/actions/deepLinking';
import database from '~/lib/database';
import { SUBSCRIPTIONS_TABLE } from '~/lib/database/model/Subscription';
import { getIsMasterDetail } from '~/lib/hooks/useMasterDetail';
import { RootEnum, type IApplicationState } from '~/definitions';
import { normalizeDeepLinkingServerHost } from '~/lib/methods/helpers/normalizeDeepLinkingServerHost';
import { emitter } from '~/lib/methods/helpers';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { clearCacheAndReconnect } from '~/lib/methods/clearCache';
import { store } from '~/lib/store/auxStore';

const isLoggedInto = (server: string, state: IApplicationState) =>
	state.server.server === server && state.login.isAuthenticated && state.app.root === RootEnum.ROOT_INSIDE;

const waitForState = (isDone: (state: IApplicationState) => boolean, signal: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		const unsubscribe = store.subscribe(() => {
			if (isDone(store.getState())) {
				unsubscribe();
				resolve();
			}
		});
		signal.addEventListener('abort', () => {
			unsubscribe();
			reject(signal.reason);
		});
	});

const waitUntil = async (isDone: (state: IApplicationState) => boolean, signal: AbortSignal) => {
	if (!isDone(store.getState())) {
		await waitForState(isDone, signal);
	}
};

const hasRoot = (state: IApplicationState) => !!state.app.root;

const hasStarted = (state: IApplicationState) => hasRoot(state) && state.app.root !== RootEnum.ROOT_LOADING;

const waitForAppStart = (signal: AbortSignal) => waitUntil(hasStarted, signal);

const waitForNavigatorReady = (signal: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		if (Navigation.navigationRef.current?.isReady()) {
			resolve();
			return;
		}
		const onReady = () => {
			emitter.off('navigationReady', onReady);
			resolve();
		};
		emitter.on('navigationReady', onReady);
		signal.addEventListener('abort', () => {
			emitter.off('navigationReady', onReady);
			reject(signal.reason);
		});
	});

const waitForRoomsSync = (server: string, signal: AbortSignal) => {
	let roomsSyncStarted = false;
	return waitForState(state => {
		roomsSyncStarted ||= state.rooms.isFetching;
		return roomsSyncStarted && !state.rooms.isFetching && isLoggedInto(server, state);
	}, signal);
};

registerTool({
	name: 'login_with_token',
	description:
		'Log in to a workspace with a REST authToken, the same way the rocketchat://auth deep link does, without the "Sign in to this workspace?" confirmation. Resolves once the rooms list has synced.',
	timeoutMs: 60_000,
	inputSchema: jsonSchema<{ host: string; token: string }>({
		type: 'object',
		properties: {
			host: { type: 'string', description: 'Workspace host, e.g. mobile.qa.rocket.chat' },
			token: { type: 'string', description: 'authToken returned by POST /api/v1/login' }
		},
		required: ['host', 'token'],
		additionalProperties: false
	}),
	outputSchema: jsonSchema<{ server: string; username: string }>({
		type: 'object',
		properties: { server: { type: 'string' }, username: { type: 'string' } },
		required: ['server', 'username']
	}),
	handler: async ({ host, token }, { signal }) => {
		await waitForAppStart(signal);
		const server = normalizeDeepLinkingServerHost(host);
		if (!isLoggedInto(server, store.getState())) {
			const loggedInWithRoomsSynced = waitForRoomsSync(server, signal);
			store.dispatch(deepLinkingOpen({ host, token }, { skipLoginConsent: true }));
			await loggedInWithRoomsSynced;
		}
		return { server, username: store.getState().login.user.username ?? '' };
	}
});

type AppState = {
	root: string | null;
	server: string | null;
	connected: boolean;
	authenticated: boolean;
	username: string | null;
	roomsSyncing: boolean;
	route: string | null;
	rid: string | null;
	tmid: string | null;
};

const stringOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);

registerTool({
	name: 'get_app_state',
	description:
		'Read where the app is: root (outside, inside, loading...), workspace, connection, whether the session is authenticated, the stored user, whether the rooms list is syncing, and the current screen with its room (rid) and thread (tmid).',
	inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {}, additionalProperties: false }),
	outputSchema: jsonSchema<AppState>({
		type: 'object',
		properties: {
			root: { type: ['string', 'null'] },
			server: { type: ['string', 'null'] },
			connected: { type: 'boolean' },
			authenticated: { type: 'boolean' },
			username: { type: ['string', 'null'] },
			roomsSyncing: { type: 'boolean' },
			route: { type: ['string', 'null'] },
			rid: { type: ['string', 'null'] },
			tmid: { type: ['string', 'null'] }
		},
		required: ['root', 'server', 'connected', 'authenticated', 'username', 'roomsSyncing', 'route', 'rid', 'tmid']
	}),
	handler: async (_input, { signal }) => {
		await waitUntil(hasRoot, signal);
		await waitForNavigatorReady(signal);
		const { app, server, meteor, login, rooms } = store.getState();
		const route = Navigation.getCurrentRoute();
		const params = (route?.params ?? {}) as Record<string, unknown>;
		return {
			root: app.root ?? null,
			server: stringOrNull(server.server),
			connected: meteor.connected,
			authenticated: login.isAuthenticated,
			username: stringOrNull(login.user.username),
			roomsSyncing: rooms.isFetching,
			route: route?.name ?? null,
			rid: stringOrNull(params.rid),
			tmid: stringOrNull(params.tmid)
		};
	}
});

registerTool({
	name: 'clear_cache',
	description:
		'Clear the local cache of the current workspace, the same way Settings > Clear cache does, without the confirmation. Resolves once the rooms list has synced again.',
	timeoutMs: 60_000,
	inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {}, additionalProperties: false }),
	outputSchema: jsonSchema<{ server: string }>({
		type: 'object',
		properties: { server: { type: 'string' } },
		required: ['server']
	}),
	handler: async (_input, { signal }) => {
		await waitForAppStart(signal);
		const { server, version } = store.getState().server;
		if (!isLoggedInto(server, store.getState())) {
			throw new Error('Not logged in to a workspace');
		}
		const roomsSynced = waitForRoomsSync(server, signal);
		await clearCacheAndReconnect({ server, version, dispatch: store.dispatch });
		await roomsSynced;
		return { server };
	}
});

registerTool({
	name: 'open_room',
	description: 'Open a room the logged-in user is subscribed to, matched by its name or display name.',
	inputSchema: jsonSchema<{ name: string }>({
		type: 'object',
		properties: {
			name: { type: 'string', description: 'Room name, display name or DM username, e.g. general or diego.mello2' }
		},
		required: ['name'],
		additionalProperties: false
	}),
	outputSchema: jsonSchema<{ rid: string; name: string; type: string }>({
		type: 'object',
		properties: { rid: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' } },
		required: ['rid', 'name', 'type']
	}),
	handler: async ({ name }, { signal }) => {
		await waitForAppStart(signal);
		if (store.getState().app.root !== RootEnum.ROOT_INSIDE) {
			throw new Error('Not logged in to a workspace');
		}
		const [subscription] = await database.active
			.get(SUBSCRIPTIONS_TABLE)
			.query(Q.or(Q.where('name', name), Q.where('fname', name)), Q.take(1))
			.fetch();
		if (!subscription) {
			throw new Error(`No subscribed room named ${name}`);
		}
		await goRoom({ item: subscription, isMasterDetail: getIsMasterDetail() });
		return { rid: subscription.rid, name: subscription.name, type: subscription.t };
	}
});
