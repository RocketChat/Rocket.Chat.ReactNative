import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only: a probe key whose silent cipher.init() detects enrollment changes without prompting.
// iOS has no counterpart — BIOMETRY_CURRENT_SET already drops the keychain item on enrollment change.

// Best effort: on failure the silent path is unavailable and the modal verify() backstop applies.
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

// The module never rejects, so a throw here means the bridge itself broke: fail closed on this gate.
export const isEnrollmentValid = async (): Promise<boolean> => {
	try {
		return await NativeBiometricEnrollment.isEnrollmentValid();
	} catch {
		return false;
	}
};
