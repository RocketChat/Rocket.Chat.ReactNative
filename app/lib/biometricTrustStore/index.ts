import * as Keychain from 'react-native-keychain';

import { type BiometricPromptCopy, type IBiometricTrustStore, type TrustResult } from '../../definitions';
import UserPreferences from '../methods/userPreferences';
import { disenrollProbe, enrollProbe, isEnrollmentValid } from './nativeEnrollmentProbe';
import {
	BIOMETRIC_TRUST_MIGRATION_V1_DONE,
	BIOMETRIC_TRUST_SENTINEL_SERVICE as SENTINEL_SERVICE,
	BIOMETRIC_TRUST_SENTINEL_USERNAME as SENTINEL_USERNAME,
	BIOMETRIC_TRUST_SENTINEL_VALUE as SENTINEL_VALUE,
	BIOMETRIC_PENDING_RELOCK_KEY,
	BIOMETRY_ENABLED_KEY
} from '../constants/localAuthentication';

// BIOMETRY_CURRENT_SET binds the item to the *current* biometric enrollment on both platforms; iOS
// invalidates the keychain entry when the enrollment set changes (errSecItemNotFound on read), and
// Android raises KeyPermanentlyInvalidatedException. That invalidation signal is the security
// primitive this whole module exists for.
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

// errSecUserCancel — biometric prompt dismissed by the user.
// errSecItemNotFound (-25300) when raised *after* the OS prompt indicates the keychain item was
// invalidated by an enrollment change on iOS.
// KeyPermanentlyInvalidatedException is the Android signal for the same condition.
export const classifyError = (e: unknown): TrustResult => {
	const err = e as { code?: string | number; name?: string; message?: string } | null | undefined;
	const code = err?.code != null ? String(err.code) : '';
	const name = err?.name ?? '';
	const message = err?.message ?? '';
	const blob = `${code} ${name} ${message}`;

	// Numeric OSStatus values are matched against the code only — testing them against the whole blob
	// would misclassify any unrelated failure that happens to mention the number in its message. That
	// matters most for -25300, whose branch drives invalidate() and would silently disable biometry.
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
			await Keychain.setGenericPassword(SENTINEL_USERNAME, SENTINEL_VALUE, writeOptions());
			// Writing the sentinel means this install is trust-initialized, so persist the migration
			// marker. Without it, an app-driven enroll (settings toggle or first-passcode setup) leaves
			// migrated=false; a later enrollment-change invalidation (flag set, sentinel gone) would then
			// hit the migration's grandfather path and be silently re-bound to the new biometrics on the
			// next launch instead of forcing the user to re-enable. See runBiometricTrustMigration.
			UserPreferences.setBool(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
			// Bind the Android native probe key to the current enrollment in lockstep with the sentinel.
			// No-op on iOS (the sentinel alone detects changes there). Best effort — see nativeEnrollmentProbe.
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
		// Tear down the Android native probe key alongside the sentinel. No-op on iOS.
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

	isEnrollmentValid() {
		// iOS: nativeEnrollmentProbe resolves true (the sentinel already covers enrollment changes).
		// Android: silent keystore cipher.init() probe — false only when the enrollment changed.
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
