import '@appduct/react-native/auto';
import { jsonSchema, registerTool } from '@appduct/react-native';
import { Q } from '@nozbe/watermelondb';

import { deepLinkingOpen } from '~/actions/deepLinking';
import database from '~/lib/database';
import { SUBSCRIPTIONS_TABLE } from '~/lib/database/model/Subscription';
import { getIsMasterDetail } from '~/lib/hooks/useMasterDetail';
import { RootEnum, type IApplicationState } from '~/definitions';
import { normalizeDeepLinkingServerHost } from '~/lib/methods/helpers/normalizeDeepLinkingServerHost';
import { goRoom } from '~/lib/methods/helpers/goRoom';
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
		const server = normalizeDeepLinkingServerHost(host);
		if (!isLoggedInto(server, store.getState())) {
			let roomsSyncStarted = false;
			const loggedInWithRoomsSynced = waitForState(state => {
				roomsSyncStarted ||= state.rooms.isFetching;
				return roomsSyncStarted && !state.rooms.isFetching && isLoggedInto(server, state);
			}, signal);
			store.dispatch(deepLinkingOpen({ host, token }, { skipLoginConsent: true }));
			await loggedInWithRoomsSynced;
		}
		return { server, username: store.getState().login.user.username ?? '' };
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
	handler: async ({ name }) => {
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
