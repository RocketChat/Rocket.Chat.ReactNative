import { Q } from '@nozbe/watermelondb';

import { shareSetSettings, shareSelectServer, shareSetUser } from '../../actions/share';
import SSLPinning from './helpers/sslPinning';
import log from './helpers/log';
import { IShareServer, IShareUser } from '../../reducers/share';
import UserPreferences from './userPreferences';
import database from '../database';
import { encryptionInit } from '../../actions/encryption';
import { store } from '../store/auxStore';
import sdk from '../services/sdk';
import { CERTIFICATE_KEY, TOKEN_KEY } from '../constants';
import { setCustomEmojis } from './getCustomEmojis';
import { Services } from '../services';
import { parseSettings } from './parseSettings';

export async function shareExtensionInit(server: string) {
	database.setShareDB(server);

	try {
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
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

	setCustomEmojis();

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
		store.dispatch(shareSetSettings(parseSettings(parsed)));

		// set User info
		const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
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
			await Services.login({ resume: user.token });
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
