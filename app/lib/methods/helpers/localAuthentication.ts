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

// Typed rejection reason for the modal promises so catch blocks can tell a benign user-cancel
// (or a request superseded by a newer one) apart from a real failure like a storage write throwing.
export class UserCanceledError extends Error {
	constructor() {
		super('User canceled local authentication');
		this.name = 'UserCanceledError';
	}
}

const openModal = (hasBiometry: boolean, force?: boolean, reason?: BiometricInvalidationReason) =>
	new Promise<void>((resolve, reject) => {
		EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, {
			submit: () => resolve(),
			hasBiometry,
			force,
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

// Proves presence, not just an unchanged enrollment: iOS gets both from the sentinel read, Android
// can't (its keystore key accepts a 5s device-credential window) — see PLATFORMS.md.
export const biometryAuth = async (force?: boolean): Promise<TrustResult> => {
	const promptCopy = buildPromptCopy(force);

	if (isIOS) {
		return biometricTrustStore.verify({ promptCopy });
	}

	try {
		if (!(await biometricTrustStore.hasEnrollment())) {
			return { kind: 'unavailable' };
		}
		if (!(await biometricTrustStore.isEnrollmentValid())) {
			return { kind: 'enrollmentChanged' };
		}
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

/*
 * It'll help us to get the permission to use FaceID
 * and enable/disable the biometry when user put their first passcode
 */
const checkBiometry = async () => {
	// Writing the sentinel is silent on both platforms, so it can't double as consent. Enroll, then
	// prompt once to ask the user to opt in to biometric unlock — tapping "Don't activate" (the cancel
	// label from buildPromptCopy(true)) opts out, and we tear the sentinel back down.
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

const hasSupportedBiometry = async (): Promise<boolean> => {
	try {
		return await LocalAuthentication.isEnrolledAsync();
	} catch {
		return false;
	}
};

// Non-prompting detection of a biometric enrollment change. This is the security primitive that lets
// an enrollment change FORCE the passcode even inside the auto-lock window: without it, re-enrolling a
// face/fingerprint and returning before the window elapses would keep the session unlocked — the very
// bypass screen lock exists to prevent.
//
// Two platform signals, neither of which shows an OS prompt:
//   - iOS: BIOMETRY_CURRENT_SET binds the sentinel to the current enrollment, so the OS drops it when
//     the enrollment set changes → a missing sentinel means re-enrollment.
//   - Android: the sentinel survives an enrollment change (the keystore key is only invalidated, not
//     deleted), so the sentinel check can't see it. A native keystore probe does a silent cipher.init()
//     that throws only when the enrollment changed; isEnrollmentValid() returns false in that case.
const hasBiometricEnrollmentChanged = async (): Promise<boolean> => {
	if (!biometricTrustStore.isEnabled()) {
		return false;
	}
	// Fail closed: a rejecting keychain/probe read forces the passcode rather than leaving the session
	// unlocked (warm-resume callers only log the throw).
	try {
		// iOS path: sentinel gone → changed.
		if (!(await biometricTrustStore.hasEnrollment())) {
			return true;
		}
		// Android path: sentinel present but the native probe key was invalidated → changed. Always valid
		// on iOS, so this never produces a false positive there.
		return !(await biometricTrustStore.isEnrollmentValid());
	} catch {
		return true;
	}
};

// A biometric enrollment change reaches us two ways:
//  - warm foreground: the flag is still enabled but the sentinel was dropped → the live check catches it.
//  - cold launch: the init migration already reconciled the flag off (it runs before us) and left a
//    relock marker, since it would otherwise have consumed the signal silently.
// Either signal must force the lock screen, so both lock checks share this predicate.
const isEnrollmentRelockRequired = async (): Promise<boolean> =>
	(await hasBiometricEnrollmentChanged()) || biometricTrustStore.isRelockPending();

export const handleLocalAuthentication = async (canCloseModal = false) => {
	// Check the cheap persisted flag first; passcode-only users shouldn't pay the native capability
	// check on every lock event.
	const biometryEnabled = biometricTrustStore.isEnabled();

	// Surface an enrollment change explicitly (see isEnrollmentRelockRequired): tear down any remaining
	// trust state and force the lock screen instead of unlocking.
	const enrollmentChanged = await isEnrollmentRelockRequired();
	if (enrollmentChanged) {
		if (biometryEnabled) {
			// invalidate() arms the relock debt AND tears down trust (disenroll → clear flag) in the
			// security-critical order — see its contract.
			await biometricTrustStore.invalidate();
		} else {
			// Cold launch: the migration already cleared the flag and armed the marker. Re-affirm it so
			// the clear below is balanced regardless of which path armed the debt.
			biometricTrustStore.setRelockPending(true);
		}
		await openModal(false, canCloseModal, 'enrollmentChanged');
		biometricTrustStore.setRelockPending(false);
		return;
	}

	const hasBiometry = biometryEnabled && (await hasSupportedBiometry());

	// Open the passcode modal first so it covers the app, then let PasscodeEnter prompt biometry from
	// behind it (its mount-time auto-biometry). Prompting here as an upstream preflight would fire the
	// OS biometric sheet with the app content still visible underneath, defeating screen lock — so the
	// verify()/invalidation flow lives in PasscodeEnter's biometry() for both the auto and button paths.
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

		// The session timestamp we persist below. Defaults to the `timesync` captured above, but if
		// the lock modal is shown it's refreshed to the moment authentication actually completes —
		// the user may sit on the lock screen longer than the auto-lock window, and persisting the
		// stale pre-modal `timesync` would let the next lock check (e.g. a late localAuthenticate
		// from the login/connect flow) see a gap >= autoLockTime and immediately re-lock a session
		// the user just unlocked.
		let authenticatedTimesync = timesync;

		// `checkHasPasscode` results newPasscode = true if a passcode has been set
		if (!result?.newPasscode) {
			// diff to last authenticated session
			const diffToLastSession = dayjs(timesync).diff(serverRecord?.lastLocalAuthenticatedSession, 'seconds');

			// During E2E runs we use a shorter threshold so tests don't have to wait past the smallest user-facing option (60s)
			const autoLockTime = process.env.RUNNING_E2E_TESTS === 'true' ? E2E_TESTS_AUTO_LOCK_TIME : serverRecord?.autoLockTime;

			// A biometric enrollment change must force the lock screen regardless of how recently the user
			// authenticated — otherwise re-enrolling a face/fingerprint inside the auto-lock window would
			// bypass authentication entirely. handleLocalAuthentication re-detects it and shows the passcode
			// with biometry disabled and the enrollment-changed notice.
			const enrollmentChanged = await isEnrollmentRelockRequired();

			// if it was not possible to get `timesync` from server, the biometric enrollment changed, or the last authenticated session is older than the configured auto lock time, authentication is required
			if (!timesync || enrollmentChanged || (autoLockTime && diffToLastSession >= autoLockTime)) {
				await hideSplashScreen();

				// set isLocalAuthenticated to false
				store.dispatch(setLocalAuthenticated(false));

				await handleLocalAuthentication();

				// set isLocalAuthenticated to true
				store.dispatch(setLocalAuthenticated(true));

				// Re-read the clock now that the user has authenticated, so the persisted session
				// reflects the unlock moment rather than when this check started.
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
