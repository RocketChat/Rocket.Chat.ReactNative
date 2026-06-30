import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only native bridge (a TurboModule). On iOS the BIOMETRY_CURRENT_SET sentinel already
// surfaces enrollment changes for free (the OS drops the keychain item), so there is no native
// counterpart — TurboModuleRegistry.get returns null and the spec's fallback reports "valid". On
// Android the keystore key survives an enrollment change and only throws on use, so a dedicated
// probe key does a silent cipher.init() to detect invalidation without ever showing the biometric
// prompt. See android/.../biometric/BiometricEnrollmentModule.kt.

// Create the probe key bound to the current enrollment, in lockstep with the trust sentinel. Best
// effort: a failure just means the silent path is unavailable and the modal verify() backstop applies.
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

// Returns true when the current biometric enrollment still matches what the probe key was bound to
// (or when not applicable, e.g. iOS). Returns false only on Android when the keystore key was
// invalidated by an enrollment change. A bridge failure resolves to true so a transient native error
// never forces the passcode on its own — the modal verify() path stays as the backstop.
export const isEnrollmentValid = async (): Promise<boolean> => {
	try {
		return await NativeBiometricEnrollment.isEnrollmentValid();
	} catch {
		return true;
	}
};
