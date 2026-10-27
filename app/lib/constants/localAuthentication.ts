export const PASSCODE_KEY = 'kPasscode';
export const LOCKED_OUT_TIMER_KEY = 'kLockedOutTimer';
export const ATTEMPTS_KEY = 'kAttempts';
export const BIOMETRY_ENABLED_KEY = 'kBiometryEnabled';
export const BIOMETRIC_TRUST_MIGRATION_V1_DONE = 'kBiometricTrustMigrationV1Done';
// Set when the init migration consumes an enrollment change; forces a passcode on the next unlock.
export const BIOMETRIC_PENDING_RELOCK_KEY = 'kBiometricPendingRelock';

// Keychain sentinel used by the biometric trust store to detect enrollment changes.
export const BIOMETRIC_TRUST_SENTINEL_SERVICE = 'rc-biometric-trust';
export const BIOMETRIC_TRUST_SENTINEL_USERNAME = 'biometric-trust';
export const BIOMETRIC_TRUST_SENTINEL_VALUE = 'v1';

export const LOCAL_AUTHENTICATE_EMITTER = 'LOCAL_AUTHENTICATE';
export const CHANGE_PASSCODE_EMITTER = 'CHANGE_PASSCODE';

export const PASSCODE_LENGTH = 6;
export const MAX_ATTEMPTS = 6;
export const TIME_TO_LOCK = 30000;

export const DEFAULT_AUTO_LOCK = 1800;

// Shortened for E2E so tests don't wait past the smallest user-facing option (60s).
export const E2E_TESTS_AUTO_LOCK_TIME = 5;
