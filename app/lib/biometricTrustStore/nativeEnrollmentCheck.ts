import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only silent enrollment check; no-op on iOS.

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

export const isEnrollmentValid = (): Promise<boolean> => NativeBiometricEnrollment.isEnrollmentValid();
