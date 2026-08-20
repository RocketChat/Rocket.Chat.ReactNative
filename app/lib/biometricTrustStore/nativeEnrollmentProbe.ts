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

// Fail closed: the module never rejects, so a throw means a broken bridge.
export const isEnrollmentValid = async (): Promise<boolean> => {
	try {
		return await NativeBiometricEnrollment.isEnrollmentValid();
	} catch {
		return false;
	}
};
