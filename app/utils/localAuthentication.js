import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';
import RNUserDefaults from 'rn-user-defaults';
import { sha256 } from 'js-sha256';

import database from '../lib/database';
import { isIOS } from './deviceInfo';
import EventEmitter from './events';
import {
	LOCAL_AUTHENTICATE_EMITTER, LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY, PASSCODE_KEY, CHANGE_PASSCODE_EMITTER
} from '../constants/localAuthentication';
import I18n from '../i18n';

// RNUserDefaults.clear(PASSCODE_KEY)

export const saveLastLocalAuthenticationSession = async(server, serverRecord) => {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');
	await serversDB.action(async() => {
		try {
			if (!serverRecord) {
				serverRecord = await serversCollection.find(server);
			}
			await serverRecord.update((record) => {
				record.lastLocalAuthenticatedSession = new Date();
			});
		} catch (e) {
			// Do nothing
		}
	});
};

export const resetAttempts = () => AsyncStorage.multiRemove([LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY]);

const openModal = hasBiometry => new Promise((resolve) => {
	EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, {
		submit: () => resolve(),
		hasBiometry
	});
});

const openChangePasscodeModal = ({ force }) => new Promise((resolve, reject) => {
	EventEmitter.emit(CHANGE_PASSCODE_EMITTER, {
		submit: passcode => resolve(passcode),
		cancel: () => reject(),
		force
	});
});

export const changePasscode = async({ force = false }) => {
	const passcode = await openChangePasscodeModal({ force });
	await RNUserDefaults.set(PASSCODE_KEY, sha256(passcode));
};

export const checkHasPasscode = async() => {
	const storedPasscode = await RNUserDefaults.get(PASSCODE_KEY);
	if (!storedPasscode) {
		await changePasscode({ force: true });
		return Promise.resolve({ newPasscode: true });
	}
	return Promise.resolve();
};

export const localAuthenticate = async(server) => {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');

	let serverRecord;
	try {
		serverRecord = await serversCollection.find(server);
	} catch (error) {
		return Promise.reject();
	}

	// if screen lock is enabled
	if (serverRecord?.autoLock) {
		// Make sure splash screen has been hidden
		RNBootSplash.hide();

		// Check if the app has passcode
		const result = await checkHasPasscode();

		// `checkHasPasscode` results newPasscode = true if a passcode has been set
		if (!result?.newPasscode) {
			// diff to last authenticated session
			const diffToLastSession = moment().diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');

			// if last authenticated session is older than configured auto lock time, authentication is required
			if (diffToLastSession >= serverRecord?.autoLockTime) {
				let hasBiometry = false;

				// if biometry is enabled on the app
				if (serverRecord?.biometry) {
					const isEnrolled = await LocalAuthentication.isEnrolledAsync();
					hasBiometry = isEnrolled;
				}

				// Authenticate
				await openModal(hasBiometry);
			}
		}

		//
		await resetAttempts();
		await saveLastLocalAuthenticationSession(server, serverRecord);
	}
};

export const supportedBiometryLabel = async() => {
	const enrolled = await LocalAuthentication.isEnrolledAsync();

	if (!enrolled) {
		return null;
	}

	const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();

	if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
		return isIOS ? 'FaceID' : I18n.t('Local_authentication_facial_recognition');
	}
	if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
		return isIOS ? 'TouchID' : I18n.t('Local_authentication_fingerprint');
	}
	return null;
};
