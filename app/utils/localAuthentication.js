import * as LocalAuthentication from 'expo-local-authentication';

import database from '../lib/database';

const localAuthenticate = async(server) => {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');

	let serverRecord;
	try {
		serverRecord = await serversCollection.find(server);
		console.log('localAuthenticate -> serverRecord', serverRecord);
	} catch (error) {
		return Promise.reject();
	}

	// if (serverRecord?.lastLocalAuthenticatedSession) {

	// }

	const authResult = await LocalAuthentication.authenticateAsync();
	return Promise.resolve(authResult?.success);
};

export default localAuthenticate;
