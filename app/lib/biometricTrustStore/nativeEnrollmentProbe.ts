import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';

// Android-only silent enrollment probe; no-op on iOS. See PLATFORMS.md, "The silent enrollment probe key".

/*
 * Fails closed like isEnrollmentValid below: without a probe key the next warm unlock's silent check
 * finds no alias and reports a change, so a swallowed failure here becomes a bogus "enrollment
 * changed" teardown later. The caller refuses to enable biometry instead. The native module resolves
 * false rather than rejecting for a keystore failure, so both paths answer false.
 */
export const enrollProbe = async (): Promise<boolean> => {
	try {
		return await NativeBiometricEnrollment.enrollProbe();
	} catch {
		return false;
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
