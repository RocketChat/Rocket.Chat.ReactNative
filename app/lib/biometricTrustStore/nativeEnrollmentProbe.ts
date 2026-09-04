import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only silent enrollment probe; no-op on iOS. See PLATFORMS.md, "The silent enrollment probe key".

// Best effort: on failure the verify() backstop applies.
export const enrollProbe = async (): Promise<void> => {
	try {
		await NativeBiometricEnrollment.enrollProbe();
	} catch {
		// best effort
	}
};

// Delete the probe key alongside the sentinel teardown.
export const disenrollProbe = async (): Promise<void> => {
	try {
		await NativeBiometricEnrollment.disenrollProbe();
	} catch {
		// best effort
	}
};

/*
 * The module never rejects, so a throw means a broken bridge — which says nothing about the key's
 * validity. Let it propagate: the caller turns it into `checkFailed` (passcode, enrollment kept)
 * rather than `invalid` (permanent teardown). See ARCHITECTURE.md, "A failed check is not a change".
 */
export const isEnrollmentValid = (): Promise<boolean> => NativeBiometricEnrollment.isEnrollmentValid();
