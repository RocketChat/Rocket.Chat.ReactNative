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
	probeExists(): Promise<boolean>;
	// Whether the user has biometric unlock enabled. Owns the persisted flag so callers don't
	// have to touch UserPreferences / BIOMETRY_ENABLED_KEY directly.
	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;
}
