import * as Keychain from 'react-native-keychain';

import { type IBiometricTrustStore, type TrustResult } from '../../definitions';
import UserPreferences from '../methods/userPreferences';
import {
	BIOMETRIC_TRUST_MIGRATION_V1_DONE,
	BIOMETRIC_TRUST_SENTINEL_SERVICE as SENTINEL_SERVICE,
	BIOMETRIC_TRUST_SENTINEL_USERNAME as SENTINEL_USERNAME,
	BIOMETRIC_TRUST_SENTINEL_VALUE as SENTINEL_VALUE,
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

const readOptions = (promptCopy: { title: string; cancel: string }): Keychain.GetOptions => ({
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

	// -128 (errSecUserCanceled) is matched against the code only — testing it against the whole blob
	// would misclassify any unrelated failure that happens to mention "-128" in its message as a
	// benign cancel.
	if (code === '-128' || /errSecUserCancel|UserCancel|user.?cancel|AuthenticationCanceled/i.test(blob)) {
		return { kind: 'canceled' };
	}
	if (/KeyPermanentlyInvalidatedException/i.test(blob)) {
		return { kind: 'enrollmentChanged' };
	}
	if (/errSecItemNotFound|-25300/i.test(blob)) {
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
	},

	async verify({ promptCopy }) {
		const exists = await biometricTrustStore.hasEnrollment();
		if (!exists) {
			return { kind: 'unavailable' };
		}
		try {
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
		try {
			const result = await Keychain.hasGenericPassword({ service: SENTINEL_SERVICE });
			return !!result;
		} catch {
			return false;
		}
	},

	isEnabled() {
		return UserPreferences.getBool(BIOMETRY_ENABLED_KEY) ?? false;
	},

	setEnabled(enabled: boolean) {
		UserPreferences.setBool(BIOMETRY_ENABLED_KEY, enabled);
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
