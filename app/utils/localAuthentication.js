import * as LocalAuthentication from 'expo-local-authentication';
import moment from 'moment';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';
import { sha256 } from 'js-sha256';

import UserPreferences from '../lib/userPreferences';
import store from '../lib/createStore';
import database from '../lib/database';
import { isIOS } from './deviceInfo';
import EventEmitter from './events';
import {
	LOCAL_AUTHENTICATE_EMITTER, LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY, PASSCODE_KEY, CHANGE_PASSCODE_EMITTER
} from '../constants/localAuthentication';
import I18n from '../i18n';
import { setLocalAuthenticated } from '../actions/login';

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
	await UserPreferences.setStringAsync(PASSCODE_KEY, sha256(passcode));
};

export const biometryAuth = force => LocalAuthentication.authenticateAsync({
	disableDeviceFallback: true,
	cancelLabel: force ? I18n.t('Dont_activate') : I18n.t('Local_authentication_biometry_fallback'),
	promptMessage: I18n.t('Local_authentication_biometry_title')
});

/*
 * It'll help us to get the permission to use FaceID
 * and enable/disable the biometry when user put their first passcode
*/
const checkBiometry = async(serverRecord) => {
	const serversDB = database.servers;

	const result = await biometryAuth(true);
	await serversDB.action(async() => {
		try {
			await serverRecord.update((record) => {
				record.biometry = !!result?.success;
			});
		} catch {
			// Do nothing
		}
	});
};

export const checkHasPasscode = async({ force = true, serverRecord }) => {
	const storedPasscode = await UserPreferences.getStringAsync(PASSCODE_KEY);
	if (!storedPasscode) {
		await changePasscode({ force });
		await checkBiometry(serverRecord);
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
		// set isLocalAuthenticated to false
		store.dispatch(setLocalAuthenticated(false));

		// Make sure splash screen has been hidden
		RNBootSplash.hide();

		// Check if the app has passcode
		const result = await checkHasPasscode({ serverRecord });

		// `checkHasPasscode` results newPasscode = true if a passcode has been set
		if (!result?.newPasscode) {
			// diff to last authenticated session
			const diffToLastSession = moment().diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');

			// if last authenticated session is older than configured auto lock time, authentication is required
			if (diffToLastSession >= serverRecord?.autoLockTime) {
				let hasBiometry = false;

				// if biometry is enabled on the app
				if (serverRecord.biometry) {
					const isEnrolled = await LocalAuthentication.isEnrolledAsync();
					hasBiometry = isEnrolled;
				}

				// Authenticate
				await openModal(hasBiometry);

				// set isLocalAuthenticated to true
				store.dispatch(setLocalAuthenticated(true));
			}
		}

		await resetAttempts();
		await saveLastLocalAuthenticationSession(server, serverRecord);
	}
};

export const supportedBiometryLabel = async() => {
	try {
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
	} catch {
		// Do nothing
	}
	return null;
};
