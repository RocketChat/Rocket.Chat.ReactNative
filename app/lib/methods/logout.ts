import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import type Model from '@nozbe/watermelondb/Model';
import * as Keychain from 'react-native-keychain';

import { getDeviceToken } from '../notifications';
import { isIOS, isSsl } from './helpers';
import { BASIC_AUTH_KEY } from './helpers/fetch';
import database, { getDatabase } from '../database';
import log from './helpers/log';
import sdk from '../services/sdk';
import { CURRENT_SERVER, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY, TOKEN_KEY } from '../constants/keys';
import UserPreferences from './userPreferences';
import { removePushToken } from '../services/restApi';
import { roomsSubscription } from './subscriptions/rooms';
import { _activeUsersSubTimeout } from './getUsersPresence';

async function removeServerKeys({ server, userId }: { server: string; userId?: string | null }) {
	UserPreferences.removeItem(`${TOKEN_KEY}-${server}`);
	if (userId) {
		UserPreferences.removeItem(`${TOKEN_KEY}-${userId}`);
	}
	UserPreferences.removeItem(`${BASIC_AUTH_KEY}-${server}`);
	UserPreferences.removeItem(`${server}-${E2E_PUBLIC_KEY}`);
	UserPreferences.removeItem(`${server}-${E2E_PRIVATE_KEY}`);
	UserPreferences.removeItem(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
	if (isIOS) {
		await Keychain.resetInternetCredentials({ server });
	}
}

export async function removeServerData({ server }: { server: string }): Promise<void> {
	try {
		const batch: Model[] = [];
		const serversDB = database.servers;
		const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);

		const usersCollection = serversDB.get('users');
		if (userId) {
			const userRecord = await usersCollection.find(userId);
			batch.push(userRecord.prepareDestroyPermanently());
		}
		const serverCollection = serversDB.get('servers');
		const serverRecord = await serverCollection.find(server);
		batch.push(serverRecord.prepareDestroyPermanently());

		await serversDB.write(() => serversDB.batch(batch));
		await removeServerKeys({ server, userId });
	} catch (e) {
		log(e);
	}
}

function removeCurrentServer() {
	UserPreferences.removeItem(CURRENT_SERVER);
}

export async function removeServerDatabase({ server }: { server: string }): Promise<void> {
	try {
		const db = getDatabase(server);
		await db.write(() => db.unsafeResetDatabase());
	} catch (e) {
		log(e);
	}
}

export async function removeServer({ server }: { server: string }): Promise<void> {
	try {
		const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
		if (userId) {
			const resume = UserPreferences.getString(`${TOKEN_KEY}-${userId}`);

			try {
				const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: isSsl(server) });
				await sdk.login({ resume });

				const token = getDeviceToken();
				if (token) {
					await sdk.del('push.token', { token });
				}

				await sdk.logout();
			} catch (e) {
				log(e);
			}
		}

		await removeServerData({ server });
		await removeServerDatabase({ server });
	} catch (e) {
		log(e);
	}
}

export async function logout({ server }: { server: string }): Promise<void> {
	if (roomsSubscription?.stop) {
		roomsSubscription.stop();
	}

	if (_activeUsersSubTimeout.activeUsersSubTimeout) {
		clearTimeout(_activeUsersSubTimeout.activeUsersSubTimeout as number);
		_activeUsersSubTimeout.activeUsersSubTimeout = false;
	}

	try {
		await removePushToken();
	} catch (e) {
		log(e);
	}

	try {
		// RC 0.60.0
		await sdk.current.logout();
	} catch (e) {
		log(e);
	}

	if (sdk.current) {
		sdk.disconnect();
	}

	await removeServerData({ server });
	await removeCurrentServer();
	await removeServerDatabase({ server });
}
