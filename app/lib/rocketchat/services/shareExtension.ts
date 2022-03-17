import { Q } from '@nozbe/watermelondb';

import { shareSetSettings, shareSelectServer, shareSetUser } from '../../../actions/share';
import SSLPinning from '../../../utils/sslPinning';
import log from '../../../utils/log';
import { IShareServer, IShareUser } from '../../../reducers/share';
import UserPreferences from '../../userPreferences';
import database from '../../database';
import RocketChat from '../rocketchat';
import { encryptionInit } from '../../../actions/encryption';
import { store } from '../../auxStore';
import sdk from './sdk';

export async function shareExtensionInit(server: string) {
	database.setShareDB(server);

	try {
		const certificate = UserPreferences.getString(`${RocketChat.CERTIFICATE_KEY}-${server}`);
		if (SSLPinning && certificate) {
			await SSLPinning.setCertificate(certificate, server);
		}
	} catch {
		// Do nothing
	}

	// sdk.current.disconnect();
	sdk.initializeShareExtension(server);

	// set Server
	const currentServer: IShareServer = {
		server,
		version: ''
	};
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	try {
		const serverRecord = await serversCollection.find(server);
		currentServer.version = serverRecord.version;
	} catch {
		// Record not found
	}
	store.dispatch(shareSelectServer(currentServer));

	RocketChat.setCustomEmojis();

	try {
		// set Settings
		const settings = ['Accounts_AvatarBlockUnauthenticatedAccess'];
		const db = database.active;
		const settingsCollection = db.get('settings');
		const settingsRecords = await settingsCollection.query(Q.where('id', Q.oneOf(settings))).fetch();
		const parsed = Object.values(settingsRecords).map(item => ({
			_id: item.id,
			valueAsString: item.valueAsString,
			valueAsBoolean: item.valueAsBoolean,
			valueAsNumber: item.valueAsNumber,
			valueAsArray: item.valueAsArray,
			_updatedAt: item._updatedAt
		}));
		store.dispatch(shareSetSettings(RocketChat.parseSettings(parsed)));

		// set User info
		const userId = UserPreferences.getString(`${RocketChat.TOKEN_KEY}-${server}`);
		const userCollections = serversDB.get('users');
		let user = null;
		if (userId) {
			const userRecord = await userCollections.find(userId);
			user = {
				id: userRecord.id,
				token: userRecord.token,
				username: userRecord.username,
				roles: userRecord.roles
			};
		}
		store.dispatch(shareSetUser(user as IShareUser));
		if (user) {
			await RocketChat.login({ resume: user.token });
		}
		store.dispatch(encryptionInit());
	} catch (e) {
		log(e);
	}
}

export function closeShareExtension() {
	sdk.disconnect();
	database.share = null;

	store.dispatch(shareSelectServer({}));
	store.dispatch(shareSetUser({}));
	store.dispatch(shareSetSettings({}));
}
