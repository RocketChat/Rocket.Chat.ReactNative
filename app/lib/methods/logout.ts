import * as FileSystem from 'expo-file-system';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import Model from '@nozbe/watermelondb/Model';

import { getDeviceToken } from '../../notifications/push';
import { extractHostname } from '../../utils/server';
import { BASIC_AUTH_KEY } from '../../utils/fetch';
import database, { getDatabase } from '../database';
import RocketChat from '../rocketchat';
import { useSsl } from '../../utils/url';
import log from '../../utils/log';
import { E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '../encryption/constants';
import UserPreferences from '../userPreferences';
import { ICertificate, IRocketChat } from '../../definitions';

async function removeServerKeys({ server, userId }: { server: string; userId: string | null }) {
	await UserPreferences.removeItem(`${RocketChat.TOKEN_KEY}-${server}`);
	if (userId) {
		await UserPreferences.removeItem(`${RocketChat.TOKEN_KEY}-${userId}`);
	}
	await UserPreferences.removeItem(`${BASIC_AUTH_KEY}-${server}`);
	await UserPreferences.removeItem(`${server}-${E2E_PUBLIC_KEY}`);
	await UserPreferences.removeItem(`${server}-${E2E_PRIVATE_KEY}`);
	await UserPreferences.removeItem(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
}

async function removeSharedCredentials({ server }: { server: string }) {
	// clear certificate for server - SSL Pinning
	try {
		const certificate = (await UserPreferences.getMapAsync(extractHostname(server))) as ICertificate | null;
		if (certificate?.path) {
			await UserPreferences.removeItem(extractHostname(server));
			await FileSystem.deleteAsync(certificate.path);
		}
	} catch (e) {
		log(e);
	}
}

async function removeServerData({ server }: { server: string }) {
	try {
		const batch: Model[] = [];
		const serversDB = database.servers;
		const userId = await UserPreferences.getStringAsync(`${RocketChat.TOKEN_KEY}-${server}`);

		const usersCollection = serversDB.get('users');
		if (userId) {
			const userRecord = await usersCollection.find(userId);
			batch.push(userRecord.prepareDestroyPermanently());
		}
		const serverCollection = serversDB.get('servers');
		const serverRecord = await serverCollection.find(server);
		batch.push(serverRecord.prepareDestroyPermanently());

		await serversDB.write(() => serversDB.batch(...batch));
		await removeSharedCredentials({ server });
		await removeServerKeys({ server, userId });
	} catch (e) {
		log(e);
	}
}

async function removeCurrentServer() {
	await UserPreferences.removeItem(RocketChat.CURRENT_SERVER);
}

async function removeServerDatabase({ server }: { server: string }) {
	try {
		const db = getDatabase(server);
		await db.write(() => db.unsafeResetDatabase());
	} catch (e) {
		log(e);
	}
}

export async function removeServer({ server }: { server: string }): Promise<void> {
	try {
		const userId = await UserPreferences.getStringAsync(`${RocketChat.TOKEN_KEY}-${server}`);
		if (userId) {
			const resume = await UserPreferences.getStringAsync(`${RocketChat.TOKEN_KEY}-${userId}`);

			const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
			await sdk.login({ resume });

			const token = getDeviceToken();
			if (token) {
				await sdk.del('push.token', { token });
			}

			await sdk.logout();
		}

		await removeServerData({ server });
		await removeServerDatabase({ server });
	} catch (e) {
		log(e);
	}
}

export default async function logout(this: IRocketChat, { server }: { server: string }): Promise<void> {
	if (this.roomsSub) {
		this.roomsSub.stop();
		this.roomsSub = null;
	}

	if (this.activeUsersSubTimeout) {
		clearTimeout(this.activeUsersSubTimeout);
		this.activeUsersSubTimeout = false;
	}

	try {
		await this.removePushToken();
	} catch (e) {
		log(e);
	}

	try {
		// RC 0.60.0
		await this.sdk.logout();
	} catch (e) {
		log(e);
	}

	if (this.sdk) {
		this.sdk = null;
	}

	await removeServerData({ server });
	await removeCurrentServer();
	await removeServerDatabase({ server });
}
