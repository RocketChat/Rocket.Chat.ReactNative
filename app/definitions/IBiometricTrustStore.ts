export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

// Why a passcode-only modal is being forced; flows from resolveBiometricTrust through the
// LOCAL_AUTHENTICATE_EMITTER payload into PasscodeEnter's subtitle.
export type BiometricInvalidationReason = 'enrollmentChanged';

export interface IBiometricTrustStore {
	enroll(): Promise<TrustResult>;
	disenroll(): Promise<void>;
	verify(opts: { promptCopy: { title: string; cancel: string } }): Promise<TrustResult>;
	// Silent check for whether the trust sentinel exists, without triggering a biometric prompt.
	// Rejects on probe/storage failures so callers can distinguish errors from true absence.
	hasEnrollment(): Promise<boolean>;
	// Whether the user has biometric unlock enabled. Owns the persisted flag so callers don't
	// have to touch UserPreferences / BIOMETRY_ENABLED_KEY directly.
	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;
	// Applies a biometry on/off toggle as one operation: enroll/disenroll the sentinel and persist
	// the flag, keeping the keychain state and flag in sync. Returns the enroll result so callers
	// can roll back their UI when enrollment fails (e.g. user cancels the OS prompt).
	setBiometryEnabled(enabled: boolean): Promise<TrustResult>;
}
