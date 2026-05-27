import * as LocalAuthentication from 'expo-local-authentication';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256 } from 'js-sha256';

import dayjs from '../../dayjs';
import UserPreferences from '../userPreferences';
import { store } from '../../store/auxStore';
import database from '../../database';
import { getServerTimeSync } from '../../services/getServerTimeSync';
import { biometricTrustStore, type TrustResult } from '../../biometricTrustStore';
import {
	ATTEMPTS_KEY,
	BIOMETRY_ENABLED_KEY,
	CHANGE_PASSCODE_EMITTER,
	LOCAL_AUTHENTICATE_EMITTER,
	LOCKED_OUT_TIMER_KEY,
	PASSCODE_KEY
} from '../../constants/localAuthentication';
import I18n from '../../../i18n';
import { setLocalAuthenticated } from '../../../actions/login';
import { type TServerModel } from '../../../definitions';
import EventEmitter from './events';
import { isIOS } from './deviceInfo';

export const saveLastLocalAuthenticationSession = async (
	server: string,
	serverRecord?: TServerModel,
	timesync?: number | null
): Promise<void> => {
	if (!timesync) {
		timesync = new Date().getTime();
	}

	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	await serversDB.write(async () => {
		try {
			if (!serverRecord) {
				serverRecord = await serversCollection.find(server);
			}
			const time = timesync || 0;
			await serverRecord.update(record => {
				record.lastLocalAuthenticatedSession = new Date(time);
			});
		} catch (e) {
			// Do nothing
		}
	});
};

export const resetAttempts = (): Promise<void> => AsyncStorage.multiRemove([LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY]);

const openModal = (hasBiometry: boolean, force?: boolean, skipAutoBiometry?: boolean) =>
	new Promise<void>((resolve, reject) => {
		EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, {
			submit: () => resolve(),
			hasBiometry,
			force,
			skipAutoBiometry,
			cancel: () => reject()
		});
	});

const openChangePasscodeModal = ({ force }: { force: boolean }) =>
	new Promise<string>((resolve, reject) => {
		EventEmitter.emit(CHANGE_PASSCODE_EMITTER, {
			submit: (passcode: string) => resolve(passcode),
			cancel: () => reject(),
			force
		});
	});

export const changePasscode = async ({ force = false }: { force: boolean }): Promise<void> => {
	const passcode = await openChangePasscodeModal({ force });
	UserPreferences.setString(PASSCODE_KEY, sha256(passcode));
};

const buildPromptCopy = (force?: boolean) => ({
	title: I18n.t('Local_authentication_biometry_title'),
	cancel: force ? I18n.t('Dont_activate') : I18n.t('Local_authentication_biometry_fallback')
});

export const biometryAuth = (force?: boolean): Promise<TrustResult> =>
	biometricTrustStore.verify({ promptCopy: buildPromptCopy(force) });

/*
 * It'll help us to get the permission to use FaceID
 * and enable/disable the biometry when user put their first passcode
 */
const checkBiometry = async () => {
	const result = await biometricTrustStore.enrol();
	const isBiometryEnabled = result.kind === 'success';
	UserPreferences.setBool(BIOMETRY_ENABLED_KEY, isBiometryEnabled);
	return isBiometryEnabled;
};

export const checkHasPasscode = async ({ force = true }: { force?: boolean }): Promise<{ newPasscode?: boolean } | void> => {
	const storedPasscode = UserPreferences.getString(PASSCODE_KEY);
	if (!storedPasscode) {
		await changePasscode({ force });
		await checkBiometry();
		return Promise.resolve({ newPasscode: true });
	}
	return Promise.resolve();
};

const hideSplashScreen = async () => {
	try {
		await RNBootSplash.hide({ fade: true });
	} catch {
		// Do nothing
	}
};

export const handleLocalAuthentication = async (canCloseModal = false) => {
	const biometryEnabled = UserPreferences.getBool(BIOMETRY_ENABLED_KEY) ?? false;

	if (!biometryEnabled) {
		await openModal(false, canCloseModal);
		return;
	}

	const result = await biometricTrustStore.verify({ promptCopy: buildPromptCopy() });

	// success → unlocked, no modal
	if (result.kind === 'success') {
		return;
	}

	// canceled / error → user dismissed or the OS prompt failed; keep biometry available on the
	// modal but skip the auto-prompt so we don't immediately re-fire the same prompt the user
	// just dismissed.
	if (result.kind === 'canceled' || result.kind === 'error') {
		await openModal(true, canCloseModal, true);
		return;
	}

	// unavailable / enrollmentChanged → no usable sentinel; passcode-only modal. Slice 02 will
	// add disenrol() + flag-clear + an explanatory reason for the enrollmentChanged case.
	await openModal(false, canCloseModal);
};

export const localAuthenticate = async (server: string): Promise<void> => {
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');

	let serverRecord: TServerModel;
	try {
		serverRecord = (await serversCollection.find(server)) as TServerModel;
	} catch (error) {
		return Promise.reject();
	}

	// if screen lock is enabled
	if (serverRecord?.autoLock) {
		// Get time from server
		const timesync = await getServerTimeSync(server);

		// Check if the app has passcode
		const result = await checkHasPasscode({});

		// `checkHasPasscode` results newPasscode = true if a passcode has been set
		if (!result?.newPasscode) {
			// diff to last authenticated session
			const diffToLastSession = dayjs(timesync).diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');

			// if it was not possible to get `timesync` from server or the last authenticated session is older than the configured auto lock time, authentication is required
			if (!timesync || (serverRecord?.autoLockTime && diffToLastSession >= serverRecord.autoLockTime)) {
				await hideSplashScreen();

				// set isLocalAuthenticated to false
				store.dispatch(setLocalAuthenticated(false));

				await handleLocalAuthentication();

				// set isLocalAuthenticated to true
				store.dispatch(setLocalAuthenticated(true));
			}
		}

		await resetAttempts();
		await saveLastLocalAuthenticationSession(server, serverRecord, timesync);
	}
};

export const supportedBiometryLabel = async (): Promise<string | null> => {
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
