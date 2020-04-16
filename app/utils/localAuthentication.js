import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';

import database from '../lib/database';
import { isIOS } from './deviceInfo';

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

	console.log('localAuthenticate -> serverRecord', serverRecord);
	if (serverRecord?.autoLock) {
		const diffToLastSession = moment().diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');
		console.log('localAuthenticate -> diffToLastSession', diffToLastSession);
		if (diffToLastSession >= serverRecord?.autoLockTime) {
			const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('localAuthenticate -> supported', supported);
			const authResult = await LocalAuthentication.authenticateAsync();
			if (authResult?.success) {
				await saveLastLocalAuthenticationSession(server);
			}
			return Promise.resolve(authResult?.success);
		} else {
			await saveLastLocalAuthenticationSession(server);
		}
	}
	return Promise.resolve(true);
};

export const supportedAuthenticationLabel = async() => {
	const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
	console.log('supportedAuthenticationLabel -> supported', supported);
	
	const enrolled = await LocalAuthentication.isEnrolledAsync();
  console.log('supportedAuthenticationLabel -> enrolled', enrolled);

	if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
		return isIOS ? 'FaceID' : 'facial recognition';
	}
	if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
		return isIOS ? 'TouchID' : 'fingerprint';
	}
	return null;
};
