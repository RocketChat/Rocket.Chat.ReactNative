import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';

import database from '../lib/database';

export const saveLastLocalAuthenticationSession = async(server) => {
  console.log('saveLastLocalAuthenticationSession -> server', server);
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');
	await serversDB.action(async() => {
		try {
			const serverRecord = await serversCollection.find(server);
      console.log('saveLastLocalAuthenticationSession -> serverRecord', serverRecord);
			await serverRecord.update((record) => {
				record.lastLocalAuthenticatedSession = new Date();
			});
		} catch (e) {
			// Do nothing
		}
	});
};

export const localAuthenticate = async(server) => {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');

	let serverRecord;
	try {
		serverRecord = await serversCollection.find(server);
		console.log('localAuthenticate -> serverRecord', serverRecord);
	} catch (error) {
		return Promise.reject();
	}

	const diffToLastSession = moment().diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');
  console.log('localAuthenticate -> diffToLastSession', diffToLastSession);
	if (diffToLastSession >= 5) {
		const authResult = await LocalAuthentication.authenticateAsync();
		if (authResult?.success) {
			await saveLastLocalAuthenticationSession(server);
		}
		return Promise.resolve(authResult?.success);
	} else {
		await saveLastLocalAuthenticationSession(server);
	}
	return Promise.resolve(true);
};
