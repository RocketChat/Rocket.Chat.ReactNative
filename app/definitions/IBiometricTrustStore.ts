export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

export interface IBiometricTrustStore {
	enrol(): Promise<TrustResult>;
	disenrol(): Promise<void>;
	verify(opts: { promptCopy: { title: string; cancel: string } }): Promise<TrustResult>;
	// Silent check for whether the trust sentinel exists, without triggering a biometric prompt.
	hasEnrolment(): Promise<boolean>;
	// Whether the user has biometric unlock enabled. Owns the persisted flag so callers don't
	// have to touch UserPreferences / BIOMETRY_ENABLED_KEY directly.
	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;
	// Applies a biometry on/off toggle as one operation: enrol/disenrol the sentinel and persist
	// the flag, keeping the keychain state and flag in sync. Returns the enrol result so callers
	// can roll back their UI when enrolment fails (e.g. user cancels the OS prompt).
	setBiometryEnabled(enabled: boolean): Promise<TrustResult>;
}
