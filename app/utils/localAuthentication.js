import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';

import database from '../lib/database';
import { isIOS } from './deviceInfo';
import EventEmitter from './events';
import { LOCAL_AUTHENTICATE } from '../views/ScreenLockedView';

export const saveLastLocalAuthenticationSession = async(server, serverRecord) => {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');
	await serversDB.action(async() => {
		try {
			if (!serverRecord) {
				serverRecord = await serversCollection.find(server);
			}
      console.log('saveLastLocalAuthenticationSession -> serverRecord', serverRecord);
			await serverRecord.update((record) => {
				record.lastLocalAuthenticatedSession = new Date();
			});
		} catch (e) {
			// Do nothing
		}
	});
};

export const localPasscode = () => new Promise((resolve, reject) => {
	EventEmitter.emit(LOCAL_AUTHENTICATE, {
		cancel: () => reject(),
		submit: () => resolve()
	});
});


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

	// if screen lock is enabled
	if (serverRecord?.autoLock) {
		// diff to last authenticated session
		const diffToLastSession = moment().diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');
		console.log('localAuthenticate -> diffToLastSession', diffToLastSession);

		// if last authenticated session is older than configured auto lock time, authentication is required
		if (diffToLastSession >= serverRecord?.autoLockTime) {
			const isEnrolled = await LocalAuthentication.isEnrolledAsync();
			const isSupported = await LocalAuthentication.supportedAuthenticationTypesAsync();

			// if biometry is enabled and enrolled on OS
			if (isEnrolled && isSupported) {
				// opens biometry prompt
				const authResult = await LocalAuthentication.authenticateAsync({ disableDeviceFallback: true });
				if (authResult?.success) {
					await saveLastLocalAuthenticationSession(server, serverRecord);
				} else {
					await localPasscode();
				}
			} else {
				await localPasscode();
			}
		}
	}
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
