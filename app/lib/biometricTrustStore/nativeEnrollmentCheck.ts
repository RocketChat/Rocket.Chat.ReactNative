import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only silent enrollment check; no-op on iOS. See PLATFORMS.md, "The silent enrollment key".

// Fails closed: with no key bound, the next warm unlock reads the missing alias as a change.
export const bindEnrollmentKey = async (): Promise<boolean> => {
	try {
		return await NativeBiometricEnrollment.bindEnrollmentKey();
	} catch {
		return false;
	}
};

export const clearEnrollmentKey = async (): Promise<void> => {
	try {
		await NativeBiometricEnrollment.clearEnrollmentKey();
	} catch {}
};

/*
 * The module never rejects, so a throw means a broken bridge — which says nothing about the key's
 * validity. Let it propagate: the caller turns it into `checkFailed` (passcode, enrollment kept)
 * rather than `invalid` (permanent teardown). See ARCHITECTURE.md, "A failed check is not a change".
 */
export const isEnrollmentValid = (): Promise<boolean> => NativeBiometricEnrollment.isEnrollmentValid();
