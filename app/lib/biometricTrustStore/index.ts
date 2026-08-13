import * as Keychain from 'react-native-keychain';

import { type BiometricPromptCopy, type IBiometricTrustStore, type TrustResult } from '../../definitions';
import UserPreferences from '../methods/userPreferences';
import { isAndroid } from '../methods/helpers/deviceInfo';
import { disenrollProbe, enrollProbe, isEnrollmentValid } from './nativeEnrollmentProbe';
import {
	BIOMETRIC_TRUST_MIGRATION_V1_DONE,
	BIOMETRIC_TRUST_SENTINEL_SERVICE as SENTINEL_SERVICE,
	BIOMETRIC_TRUST_SENTINEL_USERNAME as SENTINEL_USERNAME,
	BIOMETRIC_TRUST_SENTINEL_VALUE as SENTINEL_VALUE,
	BIOMETRIC_PENDING_RELOCK_KEY,
	BIOMETRY_ENABLED_KEY
} from '../constants/localAuthentication';

// BIOMETRY_CURRENT_SET binds the item to the current enrollment, which is the invalidation signal this
// module is built on.
const writeOptions = (): Keychain.SetOptions => ({
	service: SENTINEL_SERVICE,
	accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
	accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
});

const readOptions = (promptCopy: BiometricPromptCopy): Keychain.GetOptions => ({
	service: SENTINEL_SERVICE,
	authenticationPrompt: {
		title: promptCopy.title,
		cancel: promptCopy.cancel
	}
});

// Android silently falls back to a non-authenticated storage when no strong (Class 3) biometric is
// enrolled; iOS reports 'keychain' and has no such fallback.
const AUTH_BACKED_ANDROID_STORAGES: string[] = [Keychain.STORAGE_TYPE.AES_GCM, Keychain.STORAGE_TYPE.RSA];

const isAuthBackedStorage = (storage: string | undefined): boolean =>
	!isAndroid || (storage != null && AUTH_BACKED_ANDROID_STORAGES.includes(storage));

// -128/errSecUserCancel = dismissed; -25300/errSecItemNotFound (iOS) and
// KeyPermanentlyInvalidatedException (Android) = enrollment changed.
export const classifyError = (e: unknown): TrustResult => {
	const err = e as { code?: string | number; name?: string; message?: string } | null | undefined;
	const code = err?.code != null ? String(err.code) : '';
	const name = err?.name ?? '';
	const message = err?.message ?? '';
	const blob = `${code} ${name} ${message}`;

	// OSStatus numbers are matched on the code only: a message that merely mentions -25300 must not
	// reach the invalidate() branch.
	if (code === '-128' || /errSecUserCancel|UserCancel|user.?cancel|AuthenticationCanceled/i.test(blob)) {
		return { kind: 'canceled' };
	}
	if (/KeyPermanentlyInvalidatedException/i.test(blob)) {
		return { kind: 'enrollmentChanged' };
	}
	if (code === '-25300' || /errSecItemNotFound/i.test(blob)) {
		return { kind: 'enrollmentChanged' };
	}
	return { kind: 'error', cause: e };
};

export const biometricTrustStore: IBiometricTrustStore = {
	async enroll() {
		try {
			const written = await Keychain.setGenericPassword(SENTINEL_USERNAME, SENTINEL_VALUE, writeOptions());
			if (!written) {
				return { kind: 'unavailable' };
			}
			// A sentinel in a non-authenticated storage detects no enrollment change, so it is not a
			// success. Tear it down before the migration marker is set.
			if (!isAuthBackedStorage(written.storage)) {
				await biometricTrustStore.disenroll();
				return { kind: 'unavailable' };
			}
			// Marks the install trust-initialized so a later invalidation can't fall into the migration's
			// grandfather path and be silently re-bound. See runBiometricTrustMigration.
			UserPreferences.setBool(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
			// Binds the Android probe key in lockstep with the sentinel. Best effort; no-op on iOS.
			await enrollProbe();
			return { kind: 'success' };
		} catch (e) {
			return classifyError(e);
		}
	},

	async disenroll() {
		try {
			await Keychain.resetGenericPassword({ service: SENTINEL_SERVICE });
		} catch {
			// best-effort delete; sentinel may already be absent
		}
		await disenrollProbe();
	},

	async verify({ promptCopy }) {
		try {
			const exists = await biometricTrustStore.hasEnrollment();
			if (!exists) {
				return { kind: 'unavailable' };
			}
			const result = await Keychain.getGenericPassword(readOptions(promptCopy));
			if (result && result.password === SENTINEL_VALUE) {
				return { kind: 'success' };
			}
			// OS prompt succeeded but the sentinel is gone — treat as enrollment change.
			return { kind: 'enrollmentChanged' };
		} catch (e) {
			return classifyError(e);
		}
	},

	async hasEnrollment() {
		const result = await Keychain.hasGenericPassword({ service: SENTINEL_SERVICE });
		return !!result;
	},

	// Android: silent keystore cipher.init() probe. iOS: always true, the sentinel covers it.
	isEnrollmentValid() {
		return isEnrollmentValid();
	},

	isEnabled() {
		return UserPreferences.getBool(BIOMETRY_ENABLED_KEY) ?? false;
	},

	setEnabled(enabled: boolean) {
		UserPreferences.setBool(BIOMETRY_ENABLED_KEY, enabled);
	},

	isRelockPending() {
		return UserPreferences.getBool(BIOMETRIC_PENDING_RELOCK_KEY) ?? false;
	},

	setRelockPending(pending: boolean) {
		UserPreferences.setBool(BIOMETRIC_PENDING_RELOCK_KEY, pending);
	},

	async invalidate() {
		biometricTrustStore.setRelockPending(true);

		try {
			await biometricTrustStore.disenroll();
		} finally {
			biometricTrustStore.setEnabled(false);
		}
	},

	async setBiometryEnabled(enabled: boolean) {
		if (enabled) {
			const result = await biometricTrustStore.enroll();
			if (result.kind !== 'success') {
				biometricTrustStore.setEnabled(false);
				return result;
			}
		} else {
			await biometricTrustStore.disenroll();
		}
		biometricTrustStore.setEnabled(enabled);
		return { kind: 'success' };
	}
};

export default biometricTrustStore;
