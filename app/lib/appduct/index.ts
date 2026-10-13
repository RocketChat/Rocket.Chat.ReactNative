import '@appduct/react-native/auto';
import { jsonSchema, registerTool } from '@appduct/react-native';
import { Q } from '@nozbe/watermelondb';

import { deepLinkingOpen } from '~/actions/deepLinking';
import database from '~/lib/database';
import { SUBSCRIPTIONS_TABLE } from '~/lib/database/model/Subscription';
import { getIsMasterDetail } from '~/lib/hooks/useMasterDetail';
import { RootEnum, type IApplicationState, type TSubscriptionModel } from '~/definitions';
import { normalizeDeepLinkingServerHost } from '~/lib/methods/helpers/normalizeDeepLinkingServerHost';
import { emitter } from '~/lib/methods/helpers';
import { navigateToRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { clearCacheAndReconnect } from '~/lib/methods/clearCache';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
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

const waitForInside = async (signal: AbortSignal) => {
	await waitForAppStart(signal);
	if (store.getState().app.root !== RootEnum.ROOT_INSIDE) {
		throw new Error('Not logged in to a workspace');
	}
};

const showDrawer = () => Navigation.popTo('DrawerNavigator');

const openRoom = (room: TSubscriptionModel, isMasterDetail: boolean) => {
	if (!isMasterDetail) {
		showDrawer();
		Navigation.navigate('ChatsStackNavigator');
	}
	navigateToRoom({ item: room, isMasterDetail });
};

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
		await waitForInside(signal);
		const [subscription] = await database.active
			.get(SUBSCRIPTIONS_TABLE)
			.query(Q.or(Q.where('name', name), Q.where('fname', name)), Q.take(1))
			.fetch();
		if (!subscription) {
			throw new Error(`No subscribed room named ${name}`);
		}
		openRoom(subscription, getIsMasterDetail());
		return { rid: subscription.rid, name: subscription.name, type: subscription.t };
	}
});

const phoneStackByScreen: Record<string, string> = {
	SettingsView: 'SettingsStackNavigator',
	LanguageView: 'SettingsStackNavigator',
	SecurityPrivacyView: 'SettingsStackNavigator',
	MediaAutoDownloadView: 'SettingsStackNavigator',
	AccessibilityAndAppearanceView: 'AccessibilityStackNavigator',
	DisplayPrefsView: 'AccessibilityStackNavigator',
	ThemeView: 'AccessibilityStackNavigator',
	ProfileView: 'ProfileStackNavigator',
	UserPreferencesView: 'ProfileStackNavigator',
	UserNotificationPrefView: 'ProfileStackNavigator',
	DirectoryView: 'ChatsStackNavigator'
};

const roomScreenParams: Record<string, (room: TSubscriptionModel, isMasterDetail: boolean) => object> = {
	RoomActionsView: room => ({ rid: room.rid, t: room.t, room, joined: true }),
	RoomInfoView: (room, isMasterDetail) => ({
		rid: room.rid,
		t: room.t,
		room: room.asPlain(),
		fromRid: room.rid,
		showCloseModal: isMasterDetail
	}),
	RoomMembersView: room => ({ rid: room.rid, room, joined: true }),
	NotificationPrefView: room => ({ rid: room.rid, room }),
	ThreadMessagesView: room => ({ rid: room.rid, t: room.t })
};

const supportedScreens = [...Object.keys(phoneStackByScreen), ...Object.keys(roomScreenParams)];

const findRoute = (screen: string, rid: string | undefined) => {
	const route = Navigation.getCurrentRoute();
	const params = (route?.params ?? {}) as Record<string, unknown>;
	return route?.name === screen && (!rid || params.rid === rid) ? { route: route.name, rid: stringOrNull(params.rid) } : null;
};

const waitForRoute = (screen: string, rid: string | undefined, signal: AbortSignal) =>
	new Promise<{ route: string; rid: string | null }>((resolve, reject) => {
		const navigation = Navigation.navigationRef.current!;
		const resolveIfFocused = () => {
			const focused = findRoute(screen, rid);
			if (focused) {
				unsubscribe();
				resolve(focused);
			}
		};
		const unsubscribe = navigation.addListener('state', resolveIfFocused);
		signal.addEventListener('abort', () => {
			unsubscribe();
			reject(signal.reason);
		});
		resolveIfFocused();
	});

const openRoomScreen = async (screen: string, rid: string | undefined, isMasterDetail: boolean) => {
	if (!rid) {
		throw new Error(`${screen} needs a rid`);
	}
	const room = await getSubscriptionByRoomId(rid);
	if (!room) {
		throw new Error(`No subscribed room with rid ${rid}`);
	}
	openRoom(room, isMasterDetail);
	const params = roomScreenParams[screen](room, isMasterDetail);
	if (isMasterDetail) {
		Navigation.navigate('ModalStackNavigator', { screen, params });
	} else {
		Navigation.navigate(screen, params);
	}
};

registerTool({
	name: 'navigate',
	description:
		'Open a screen by route name and resolve with the focused route. Room screens open the room first and need its rid; omnichannel rooms are not supported.',
	inputSchema: jsonSchema<{ screen: string; rid?: string }>({
		type: 'object',
		properties: {
			screen: { type: 'string', enum: supportedScreens, description: 'Route name, e.g. SettingsView or RoomInfoView' },
			rid: { type: 'string', description: 'Room id, required by room screens' }
		},
		required: ['screen'],
		additionalProperties: false
	}),
	outputSchema: jsonSchema<{ route: string; rid: string | null }>({
		type: 'object',
		properties: { route: { type: 'string' }, rid: { type: ['string', 'null'] } },
		required: ['route', 'rid']
	}),
	handler: async ({ screen, rid }, { signal }) => {
		if (!supportedScreens.includes(screen)) {
			throw new Error(`Unsupported screen ${screen}. Supported: ${supportedScreens.join(', ')}`);
		}
		await waitForInside(signal);
		await waitForNavigatorReady(signal);
		const isMasterDetail = getIsMasterDetail();
		const isRoomScreen = screen in roomScreenParams;
		if (isRoomScreen) {
			await openRoomScreen(screen, rid, isMasterDetail);
		} else if (isMasterDetail) {
			showDrawer();
			Navigation.navigate('ModalStackNavigator', { screen });
		} else {
			showDrawer();
			Navigation.navigate(phoneStackByScreen[screen], { screen, initial: false, pop: true });
		}
		return waitForRoute(screen, isRoomScreen ? rid : undefined, signal);
	}
});
