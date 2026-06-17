export const PASSCODE_KEY = 'kPasscode';
export const LOCKED_OUT_TIMER_KEY = 'kLockedOutTimer';
export const ATTEMPTS_KEY = 'kAttempts';
export const BIOMETRY_ENABLED_KEY = 'kBiometryEnabled';
export const BIOMETRIC_TRUST_MIGRATION_V1_DONE = 'kBiometricTrustMigrationV1Done';

export const LOCAL_AUTHENTICATE_EMITTER = 'LOCAL_AUTHENTICATE';
export const CHANGE_PASSCODE_EMITTER = 'CHANGE_PASSCODE';

export const PASSCODE_LENGTH = 6;
export const MAX_ATTEMPTS = 6;
export const TIME_TO_LOCK = 30000;

export const DEFAULT_AUTO_LOCK = 1800;

// During E2E runs we shorten the auto-lock threshold so tests don't have to wait
// past the smallest user-facing option (60s) to trigger the screen lock.
export const E2E_TESTS_AUTO_LOCK_TIME = 5;

// Keychain sentinel used by the biometric trust store to detect enrollment changes.
export const BIOMETRIC_TRUST_SENTINEL_SERVICE = 'chat.rocket.reactnative.biometric-trust';
export const BIOMETRIC_TRUST_SENTINEL_USERNAME = 'biometric-trust';
export const BIOMETRIC_TRUST_SENTINEL_VALUE = 'v1';
