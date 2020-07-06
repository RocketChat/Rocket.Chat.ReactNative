import * as FileSystem from 'expo-file-system';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';

import { SERVERS, SERVER_URL } from '../../constants/userDefaults';
import { getDeviceToken } from '../../notifications/push';
import { extractHostname } from '../../utils/server';
import { BASIC_AUTH_KEY } from '../../utils/fetch';
import database, { getDatabase } from '../database';
import RocketChat from '../rocketchat';
import { useSsl } from '../../utils/url';
import MMKV from '../../utils/mmkv';

async function removeServerKeys({ server, userId }) {
	await MMKV.removeItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
	await MMKV.removeItem(`${ RocketChat.TOKEN_KEY }-${ userId }`);
	await MMKV.removeItem(`${ BASIC_AUTH_KEY }-${ server }`);
}

async function removeSharedCredentials({ server }) {
	try {
		const servers = await MMKV.getMapAsync(SERVERS);
		await MMKV.setMapAsync(SERVERS, servers && servers.filter(srv => srv[SERVER_URL] !== server));

		// clear certificate for server - SSL Pinning
		const certificate = await MMKV.getMapAsync(extractHostname(server));
		if (certificate && certificate.path) {
			await MMKV.removeItem(extractHostname(server));
			await FileSystem.deleteAsync(certificate.path);
		}
	} catch (e) {
		console.log('removeSharedCredentials', e);
	}
}

async function removeServerData({ server }) {
	try {
		const batch = [];
		const serversDB = database.servers;
		const userId = await MMKV.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);

		const usersCollection = serversDB.collections.get('users');
		if (userId) {
			const userRecord = await usersCollection.find(userId);
			batch.push(userRecord.prepareDestroyPermanently());
		}
		const serverCollection = serversDB.collections.get('servers');
		const serverRecord = await serverCollection.find(server);
		batch.push(serverRecord.prepareDestroyPermanently());

		await serversDB.action(() => serversDB.batch(...batch));
		await removeSharedCredentials({ server });
		await removeServerKeys({ server });
	} catch (e) {
		console.log('removeServerData', e);
	}
}

async function removeCurrentServer() {
	await MMKV.removeItem('currentServer');
	await MMKV.removeItem(RocketChat.TOKEN_KEY);
}

async function removeServerDatabase({ server }) {
	try {
		const db = getDatabase(server);
		await db.action(() => db.unsafeResetDatabase());
	} catch (e) {
		console.log(e);
	}
}

export async function removeServer({ server }) {
	try {
		const userId = await MMKV.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);
		if (userId) {
			const resume = await MMKV.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ userId }`);

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
		console.log('removePush', e);
	}
}

export default async function logout({ server }) {
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
		console.log('removePushToken', e);
	}

	try {
		// RC 0.60.0
		await this.sdk.logout();
	} catch (e) {
		console.log('logout', e);
	}

	if (this.sdk) {
		this.sdk = null;
	}

	await removeServerData({ server });
	await removeCurrentServer();
	await removeServerDatabase({ server });
}
