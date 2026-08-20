import * as LocalAuthentication from 'expo-local-authentication';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256 } from 'js-sha256';

import dayjs from '../../dayjs';
import UserPreferences from '../userPreferences';
import { store } from '../../store/auxStore';
import database from '../../database';
import { getServerTimeSync } from '../../services/getServerTimeSync';
import { biometricTrustStore } from '../../biometricTrustStore';
import {
	ATTEMPTS_KEY,
	CHANGE_PASSCODE_EMITTER,
	E2E_TESTS_AUTO_LOCK_TIME,
	LOCAL_AUTHENTICATE_EMITTER,
	LOCKED_OUT_TIMER_KEY,
	PASSCODE_KEY
} from '../../constants/localAuthentication';
import I18n from '../../../i18n';
import { setLocalAuthenticated } from '../../../actions/login';
import {
	type BiometricInvalidationReason,
	type BiometricPromptCopy,
	type TServerModel,
	type TrustResult
} from '../../../definitions';
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

// Lets catch blocks tell a benign cancel/supersede apart from a real failure.
export class UserCanceledError extends Error {
	constructor() {
		super('User canceled local authentication');
		this.name = 'UserCanceledError';
	}
}

const openModal = (hasBiometry: boolean, canClose?: boolean, reason?: BiometricInvalidationReason) =>
	new Promise<void>((resolve, reject) => {
		EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, {
			submit: () => resolve(),
			hasBiometry,
			canClose,
			reason,
			cancel: () => reject(new UserCanceledError())
		});
	});

const openChangePasscodeModal = ({ force }: { force: boolean }) =>
	new Promise<string>((resolve, reject) => {
		EventEmitter.emit(CHANGE_PASSCODE_EMITTER, {
			submit: (passcode: string) => resolve(passcode),
			cancel: () => reject(new UserCanceledError()),
			force
		});
	});

export const changePasscode = async ({ force = false }: { force: boolean }): Promise<void> => {
	const passcode = await openChangePasscodeModal({ force });
	UserPreferences.setString(PASSCODE_KEY, sha256(passcode));
};

const buildPromptCopy = (force?: boolean): BiometricPromptCopy => ({
	title: I18n.t('Local_authentication_biometry_title'),
	cancel: force ? I18n.t('Dont_activate') : I18n.t('Local_authentication_biometry_fallback')
});

const classifyPresenceError = (error?: LocalAuthentication.LocalAuthenticationError): TrustResult => {
	switch (error) {
		case 'user_cancel':
		case 'app_cancel':
		case 'system_cancel':
		case 'user_fallback':
		case 'authentication_failed':
			return { kind: 'canceled' };
		case 'not_enrolled':
		case 'not_available':
			return { kind: 'unavailable' };
		default:
			return { kind: 'error', cause: error };
	}
};

// Single source for the sentinel-then-probe order. Callers map the state onto their own contract:
// on iOS the sentinel carries the whole signal and isEnrollmentValid() is always true.
type EnrollmentCheck = { state: 'valid' | 'absent' | 'invalid' } | { state: 'error'; cause: unknown };

const checkBiometricEnrollment = async (): Promise<EnrollmentCheck> => {
	try {
		if (!(await biometricTrustStore.hasEnrollment())) {
			return { state: 'absent' };
		}
		return { state: (await biometricTrustStore.isEnrollmentValid()) ? 'valid' : 'invalid' };
	} catch (cause) {
		return { state: 'error', cause };
	}
};

// Proves presence, not just an unchanged enrollment: iOS gets both from the sentinel read, Android
// can't (its keystore key accepts a 5s device-credential window) — see PLATFORMS.md.
export const biometryAuth = async (force?: boolean): Promise<TrustResult> => {
	const promptCopy = buildPromptCopy(force);

	if (isIOS) {
		return biometricTrustStore.verify({ promptCopy });
	}

	const enrollment = await checkBiometricEnrollment();
	if (enrollment.state === 'absent') {
		return { kind: 'unavailable' };
	}
	if (enrollment.state === 'invalid') {
		return { kind: 'enrollmentChanged' };
	}
	if (enrollment.state === 'error') {
		return { kind: 'error', cause: enrollment.cause };
	}

	try {
		const presence = await LocalAuthentication.authenticateAsync({
			disableDeviceFallback: true,
			cancelLabel: promptCopy.cancel,
			promptMessage: promptCopy.title
		});
		return presence.success ? { kind: 'success' } : classifyPresenceError(presence.error);
	} catch (e) {
		return { kind: 'error', cause: e };
	}
};

// Class 3 only: isEnrolledAsync() is a BIOMETRIC_WEAK query on Android, and the keystore won't bind a
// user-auth key to a weak biometric. iOS reports any biometry as strong.
export const hasSupportedBiometry = async (): Promise<boolean> => {
	try {
		if (!(await LocalAuthentication.isEnrolledAsync())) {
			return false;
		}
		const level = await LocalAuthentication.getEnrolledLevelAsync();
		return level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;
	} catch {
		return false;
	}
};

/*
 * It'll help us to get the permission to use FaceID
 * and enable/disable the biometry when user put their first passcode
 */
const checkBiometry = async () => {
	// Without a strong biometric enroll() can only produce a downgraded sentinel, so don't offer the
	// opt-in at all rather than offering and revoking it.
	if (!(await hasSupportedBiometry())) {
		biometricTrustStore.setEnabled(false);
		return false;
	}

	// The sentinel write is silent, so it can't double as consent: enroll, then prompt once to opt in.
	const enrollResult = await biometricTrustStore.enroll();
	if (enrollResult.kind !== 'success') {
		biometricTrustStore.setEnabled(false);
		return false;
	}

	// Via biometryAuth, not verify(): a prompt that never appeared isn't consent.
	const consent = await biometryAuth(true);
	const isBiometryEnabled = consent.kind === 'success';
	if (!isBiometryEnabled) {
		await biometricTrustStore.disenroll();
	}
	biometricTrustStore.setEnabled(isBiometryEnabled);
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

// Non-prompting. Lets an enrollment change force the passcode even inside the auto-lock window.
const hasBiometricEnrollmentChanged = async (): Promise<boolean> => {
	if (!biometricTrustStore.isEnabled()) {
		return false;
	}
	// Fail closed: anything but a clean valid read forces the passcode rather than leaving the session unlocked.
	const enrollment = await checkBiometricEnrollment();
	return enrollment.state !== 'valid';
};

// Warm foreground surfaces the change live; cold launch gets it from the marker the init migration
// left behind. Both must force the lock screen.
const isEnrollmentRelockRequired = async (): Promise<boolean> =>
	(await hasBiometricEnrollmentChanged()) || biometricTrustStore.isRelockPending();

interface IHandleLocalAuthentication {
	canCloseModal?: boolean;
	// Result of a check the caller already ran, so the unlock path doesn't repeat the native probe.
	// Omit it (direct callers) to compute it here; `false` is a real answer and must not re-trigger it.
	relockRequired?: boolean;
}

export const handleLocalAuthentication = async ({ canCloseModal = false, relockRequired }: IHandleLocalAuthentication = {}) => {
	// Cheap flag first: passcode-only users shouldn't pay the native capability check per lock event.
	const biometryEnabled = biometricTrustStore.isEnabled();

	const enrollmentChanged = relockRequired || await isEnrollmentRelockRequired();
	if (enrollmentChanged) {
		if (biometryEnabled) {
			await biometricTrustStore.invalidate();
		} else {
			// Migration already cleared the flag; re-affirm the marker so the clear below stays balanced.
			biometricTrustStore.setRelockPending(true);
		}
		await openModal(false, canCloseModal, 'enrollmentChanged');
		biometricTrustStore.setRelockPending(false);
		return;
	}

	const hasBiometry = biometryEnabled && (await hasSupportedBiometry());

	// Modal first so it covers the app; PasscodeEnter prompts biometry from behind it. Prompting here
	// would show the OS sheet over visible app content.
	await openModal(hasBiometry, canCloseModal);
	biometricTrustStore.setRelockPending(false);
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

		// Refreshed after the modal: persisting the stale pre-modal timesync would immediately re-lock a
		// session the user just unlocked.
		let authenticatedTimesync = timesync;

		// `checkHasPasscode` results newPasscode = true if a passcode has been set
		if (!result?.newPasscode) {
			// diff to last authenticated session
			const diffToLastSession = dayjs(timesync).diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');

			// During E2E runs we use a shorter threshold so tests don't have to wait past the smallest user-facing option (60s)
			const autoLockTime = process.env.RUNNING_E2E_TESTS === 'true' ? E2E_TESTS_AUTO_LOCK_TIME : serverRecord?.autoLockTime;

			// Must force the lock screen regardless of how recently the user authenticated.
			const enrollmentChanged = await isEnrollmentRelockRequired();

			// if it was not possible to get `timesync` from server, the biometric enrollment changed, or the last authenticated session is older than the configured auto lock time, authentication is required
			if (!timesync || enrollmentChanged || (autoLockTime && diffToLastSession >= autoLockTime)) {
				await hideSplashScreen();

				// set isLocalAuthenticated to false
				store.dispatch(setLocalAuthenticated(false));

				await handleLocalAuthentication({ relockRequired: enrollmentChanged });

				// set isLocalAuthenticated to true
				store.dispatch(setLocalAuthenticated(true));

				authenticatedTimesync = await getServerTimeSync(server);
			}
		}

		await resetAttempts();
		await saveLastLocalAuthenticationSession(server, serverRecord, authenticatedTimesync);
	}
};

export const supportedBiometryLabel = async (): Promise<string | null> => {
	try {
		const enrolled = await hasSupportedBiometry();

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
