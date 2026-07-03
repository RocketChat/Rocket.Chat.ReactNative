export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

// Why a passcode-only modal is being forced; flows from resolveBiometricTrust through the
// LOCAL_AUTHENTICATE_EMITTER payload into PasscodeEnter's subtitle.
export type BiometricInvalidationReason = 'enrollmentChanged';

// Localized copy for the OS biometric prompt shown by verify(). Built in localAuthentication and
// passed down to the keychain read options.
export type BiometricPromptCopy = { title: string; cancel: string };

export interface IBiometricTrustStore {
	enroll(): Promise<TrustResult>;
	disenroll(): Promise<void>;
	verify(opts: { promptCopy: BiometricPromptCopy }): Promise<TrustResult>;
	// Silent check for whether the trust sentinel exists, without triggering a biometric prompt.
	// Rejects on probe/storage failures so callers can distinguish errors from true absence.
	hasEnrollment(): Promise<boolean>;
	// Silent check for whether the current biometric enrollment still matches what trust was bound to.
	// iOS surfaces enrollment changes through the sentinel (hasEnrollment), so this returns true there;
	// Android's sentinel survives a change, so this consults a native keystore probe instead. Never
	// prompts. Returns false only when an Android enrollment change is detected.
	isEnrollmentValid(): Promise<boolean>;
	// Whether the user has biometric unlock enabled. Owns the persisted flag so callers don't
	// have to touch UserPreferences / BIOMETRY_ENABLED_KEY directly.
	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;
	// "Relock pending" marker. Set when an enrollment change is detected at a point that can't show the
	// passcode itself (the init migration), so the next unlock is forced to demand it regardless of the
	// auto-lock window. Owns the persisted flag so callers don't touch UserPreferences directly.
	isRelockPending(): boolean;
	setRelockPending(pending: boolean): void;
	invalidate(): Promise<void>;
	// Applies a biometry on/off toggle as one operation: enroll/disenroll the sentinel and persist
	// the flag, keeping the keychain state and flag in sync. Returns the enroll result so callers
	// can roll back their UI when enrollment fails (e.g. user cancels the OS prompt).
	setBiometryEnabled(enabled: boolean): Promise<TrustResult>;
}
