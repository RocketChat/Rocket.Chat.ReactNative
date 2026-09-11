export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

// Why a passcode-only modal is being forced; surfaces as PasscodeEnter's subtitle.
export type BiometricInvalidationReason = 'enrollmentChanged' | 'trustLost' | 'relockRequired';

// Localized copy for the OS biometric prompt shown by verify().
export type BiometricPromptCopy = { title: string; cancel: string };

export interface IBiometricTrustStore {
	enroll(): Promise<TrustResult>;
	disenroll(): Promise<void>;
	verify(opts: { promptCopy: BiometricPromptCopy }): Promise<TrustResult>;
	// Silent. Rejects on keystore/storage failures so callers can tell errors from true absence.
	hasEnrollment(): Promise<boolean>;
	// Silent. False only on a detected Android enrollment change; always true on iOS, where
	// hasEnrollment covers it.
	isEnrollmentValid(): Promise<boolean>;
	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;
	// Forces a passcode on the next unlock regardless of the auto-lock window.
	isRelockPending(): boolean;
	setRelockPending(pending: boolean): void;
	invalidate(): Promise<void>;
	// Disenroll and clear the flag as one operation. Disenroll is best-effort, so this cannot fail:
	// the user must always be able to turn biometry off. Enabling goes through enableBiometry.
	disableBiometry(): Promise<void>;
}
