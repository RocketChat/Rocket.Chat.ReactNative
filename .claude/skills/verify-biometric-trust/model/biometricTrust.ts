// Biometric trust: the persisted bits, every flow that writes them one write per step, crashes between
// any two writes, and OS events that invalidate the bound secrets. Sources are cited per action; see SKILL.md.

type Platform = 'ios' | 'android';
// bound: written for the current biometric set. stale: the OS set changed since. absent: never written or deleted.
type Secret = 'absent' | 'bound' | 'stale';
type Pc =
	| 'idle'
	| 'migrating'
	| 'checking'
	| 'handingOff'
	| 'invalidating'
	| 'modal'
	| 'clearing'
	| 'enrolling'
	| 'consenting'
	| 'disabling';
type Prompt = 'success' | 'canceled' | 'error';
type TrustResult = 'success' | 'canceled' | 'error' | 'enrollmentChanged' | 'unavailable';
type RelockReason = 'none' | 'checkFailed' | 'enrollmentChanged' | 'trustLost' | 'relockRequired';

let platform!: Platform;
// iOS answer of hasGenericPassword for a BIOMETRY_CURRENT_SET item the OS invalidated. Assumed NO: the item reads
// as errSecItemNotFound (-25300, classifyError). The library resolves YES only on noErr and errSecInteractionNotAllowed.
const iosStaleSentinelVisible = false;

// Persisted: UserPreferences BIOMETRY_ENABLED_KEY, BIOMETRIC_PENDING_RELOCK_KEY, the Keychain sentinel,
// the Android enrollment key. Start: fresh install, or an install from before the sentinel existed.
let enabled!: boolean;
let pending = false;
let sentinel: Secret = 'absent';
let key: Secret = 'absent';

// In memory, lost on a crash.
let booted = false;
let unlocked = false;
let pc: Pc = 'idle';
let step = 0;
let invalidateReturnsTo: Pc = 'idle';
let modalBiometry = false;
let clearAfterModal = false;
let lastUnlockByPasscode = false;
let enabledAtUnlockStart = false;
let checkWithinWindow = false;
let readsEnabledAfterCheck = false;
let reasonForHandoff: RelockReason = 'none';
let checkedEnrollment: 'valid' | 'absent' | 'invalid' | 'error' = 'valid';

// Ghosts: what the user and the OS did, which the code cannot see.
let consented!: boolean;
let tainted!: boolean;
let owed!: boolean;
let biometricUnlockWhileTainted = false;
let windowSkipWhileOwed = false;
let relockClearedWithoutPasscode = false;

/** @initially */
export const start = () => consented === enabled && tainted === enabled && owed === enabled;

const readTrustState = () =>
	enabled ? (pending ? 'enabledRelockPending' : 'enabled') : pending ? 'disabledRelockPending' : 'disabled';

// biometricTrustStore.hasEnrollment: Keychain.hasGenericPassword.
const hasEnrollment = () => sentinel === 'bound' || (sentinel === 'stale' && (platform === 'android' || iosStaleSentinelVisible));

// biometricTrustStore.isEnrollmentValid: Android keystore cipher.init(); a missing alias reads as a change. iOS: true.
const isEnrollmentValid = () => platform === 'ios' || key === 'bound';

// localAuthentication.ts getRelockReason after its await: the enrollment result, then a fresh readTrustState.
const reasonAfterCheck = (): RelockReason => {
	if (checkedEnrollment === 'error') return 'checkFailed';
	if (checkedEnrollment === 'invalid') return 'enrollmentChanged';
	if (checkedEnrollment === 'absent') return 'trustLost';
	const trust = readTrustState();
	return trust === 'enabledRelockPending' || trust === 'disabledRelockPending' ? 'relockRequired' : 'none';
};

// localAuthentication.ts biometryAuth: iOS biometricTrustStore.verify, Android checkBiometricEnrollment + authenticateAsync.
const biometryAuth = (userSays: Prompt): TrustResult => {
	if (!hasEnrollment()) return 'unavailable';
	if (platform === 'ios') return sentinel === 'bound' ? userSays : 'enrollmentChanged';
	if (!isEnrollmentValid()) return 'enrollmentChanged';
	return userSays;
};

const startInvalidate = (returnsTo: Pc) => {
	pc = 'invalidating';
	step = 1;
	invalidateReturnsTo = returnsTo;
};

const openModal = (biometry: boolean, clearAfter: boolean) => {
	modalBiometry = biometry;
	clearAfterModal = clearAfter;
	lastUnlockByPasscode = false;
};

// The app process dies: memory is lost, persisted bits stay.
export const crash = () => {
	if (!booted) return;
	booted = false;
	unlocked = false;
	pc = 'idle';
	step = 0;
	modalBiometry = false;
	clearAfterModal = false;
	lastUnlockByPasscode = false;
};

// init.js restore: runBiometricTrustMigration runs before any unlock.
export const coldLaunch = () => {
	if (booted) return;
	booted = true;
	pc = 'migrating';
};

// migration.ts runBiometricTrustMigration.
export const migrate = () => {
	if (pc !== 'migrating') return;
	if (enabled && !hasEnrollment()) {
		startInvalidate('idle');
	} else {
		pc = 'idle';
	}
};

// biometricTrustStore.invalidate: setRelockPending(true), disenroll (sentinel, then enrollment key), setEnabled(false).
// disenroll swallows a failed delete, so either delete may leave its secret behind.
export const invalidateWrites = (deleteSucceeds: boolean) => {
	if (pc !== 'invalidating') return;
	if (step === 1) {
		pending = true;
		step = 2;
	} else if (step === 2) {
		if (deleteSucceeds) sentinel = 'absent';
		step = 3;
	} else if (step === 3) {
		if (deleteSucceeds) key = 'absent';
		step = 4;
	} else {
		enabled = false;
		consented = false;
		step = 0;
		pc = invalidateReturnsTo;
	}
};

const openModalForReason = (reason: RelockReason) => {
	if (reason === 'checkFailed') {
		pc = 'modal';
		openModal(false, false);
	} else if (reason === 'none') {
		pc = 'modal';
		openModal(enabledAtUnlockStart, true);
	} else if (enabledAtUnlockStart) {
		openModal(false, true);
		startInvalidate('modal');
	} else {
		pc = 'modal';
		openModal(false, true);
	}
};

const finishRelockCheck = (reason: RelockReason) => {
	if (reason === 'none' && checkWithinWindow) {
		pc = 'idle';
		unlocked = true;
		windowSkipWhileOwed = windowSkipWhileOwed || owed;
	} else if (readsEnabledAfterCheck) {
		reasonForHandoff = reason;
		pc = 'handingOff';
	} else {
		openModalForReason(reason);
	}
};

// viaLocalAuthenticate: localAuthenticate computes the reason, awaits hideSplashScreen, then calls
// handleLocalAuthentication({ relockReason }), which reads isEnabled only then.
// Otherwise ScreenLockConfigView / SecurityPrivacyView call handleLocalAuthentication directly: isEnabled first, no window.
export const unlockStarts = (viaLocalAuthenticate: boolean, withinWindow: boolean, checkErrors: boolean) => {
	if (!booted || pc !== 'idle' || unlocked) return;
	if (withinWindow && !viaLocalAuthenticate) return;
	readsEnabledAfterCheck = viaLocalAuthenticate;
	enabledAtUnlockStart = enabled;
	checkWithinWindow = withinWindow;
	const trust = readTrustState();
	if (trust === 'disabled') {
		finishRelockCheck('none');
	} else if (trust === 'disabledRelockPending') {
		finishRelockCheck('trustLost');
	} else {
		checkedEnrollment = checkErrors ? 'error' : !hasEnrollment() ? 'absent' : !isEnrollmentValid() ? 'invalid' : 'valid';
		pc = 'checking';
	}
};

// The await on checkBiometricEnrollment returns.
export const enrollmentCheckReturns = () => {
	if (pc !== 'checking') return;
	finishRelockCheck(reasonAfterCheck());
};

// handleLocalAuthentication entered from localAuthenticate after hideSplashScreen.
export const handoffToModal = () => {
	if (pc !== 'handingOff') return;
	enabledAtUnlockStart = enabled;
	openModalForReason(reasonForHandoff);
};

// A second localAuthenticate (foreground and deep-link sagas overlap) saw a biometric change and invalidates during
// this one's awaits. finished = false: only its synchronous setRelockPending(true) has landed.
export const overlappingUnlockInvalidates = (finished: boolean) => {
	if ((pc !== 'checking' && pc !== 'handingOff') || pending || !enabled) return;
	pending = true;
	tainted = true;
	if (sentinel === 'bound') sentinel = 'stale';
	if (key === 'bound') key = 'stale';
	if (enabled) owed = true;
	if (finished) {
		sentinel = 'absent';
		key = 'absent';
		enabled = false;
		consented = false;
	}
};

// PasscodeEnter: the user types the passcode.
export const enterPasscode = () => {
	if (pc !== 'modal') return;
	owed = false;
	lastUnlockByPasscode = true;
	if (clearAfterModal) {
		pc = 'clearing';
	} else {
		pc = 'idle';
		unlocked = true;
	}
};

// PasscodeEnter biometry -> resolveBiometricTrust.
export const tapBiometry = (userSays: Prompt) => {
	if (pc !== 'modal' || !modalBiometry) return;
	const result = biometryAuth(userSays);
	if (result === 'success') {
		biometricUnlockWhileTainted = biometricUnlockWhileTainted || tainted;
		windowSkipWhileOwed = windowSkipWhileOwed || owed;
		pc = 'clearing';
	} else if (result === 'enrollmentChanged' || result === 'unavailable') {
		modalBiometry = false;
		startInvalidate('modal');
	}
};

// handleLocalAuthentication: setRelockPending(false) after the modal resolves.
export const clearRelock = () => {
	if (pc !== 'clearing') return;
	relockClearedWithoutPasscode = relockClearedWithoutPasscode || (pending && !lastUnlockByPasscode);
	pending = false;
	pc = 'idle';
	unlocked = true;
};

export const lockApp = () => {
	if (pc !== 'idle' || !unlocked) return;
	unlocked = false;
};

// ScreenLockConfigView toggle on -> enableBiometry -> enroll: setGenericPassword.
export const userEnablesBiometry = () => {
	if (!booted || pc !== 'idle' || !unlocked || enabled) return;
	sentinel = 'bound';
	pc = 'enrolling';
};

// enroll: Android bindEnrollmentKey (or a downgraded storage); a failure disenrolls and enableBiometry turns the flag off.
export const bindEnrollmentKey = (succeeds: boolean) => {
	if (pc !== 'enrolling') return;
	if (platform === 'ios') {
		pc = 'consenting';
	} else if (succeeds) {
		key = 'bound';
		pc = 'consenting';
	} else {
		pc = 'disabling';
		step = 1;
	}
};

// enableBiometry: biometryAuth(true) is the consent prompt; setEnabled(true) follows it synchronously.
export const consentPrompt = (userSays: Prompt) => {
	if (pc !== 'consenting') return;
	if (biometryAuth(userSays) === 'success') {
		enabled = true;
		consented = true;
		tainted = false;
		pc = 'idle';
	} else {
		pc = 'disabling';
		step = 1;
	}
};

// ScreenLockConfigView toggle off -> disableBiometry.
export const userDisablesBiometry = () => {
	if (!booted || pc !== 'idle' || !unlocked || !enabled) return;
	pc = 'disabling';
	step = 1;
};

// disenroll (sentinel, then enrollment key), then setEnabled(false).
export const disableWrites = (deleteSucceeds: boolean) => {
	if (pc !== 'disabling') return;
	if (step === 1) {
		if (deleteSucceeds) sentinel = 'absent';
		step = 2;
	} else if (step === 2) {
		if (deleteSucceeds) key = 'absent';
		step = 3;
	} else {
		enabled = false;
		consented = false;
		owed = false;
		step = 0;
		pc = 'idle';
	}
};

// The user adds or removes a fingerprint or face: BIOMETRY_CURRENT_SET items and the Android key go stale.
// Not during "checking": checkedEnrollment is already read, so a change there is the same as one right after the unlock.
export const osEnrollmentChanges = () => {
	if (pc === 'checking') return;
	if (sentinel !== 'bound' && key !== 'bound' && tainted && (owed || !enabled)) return;
	if (sentinel === 'bound') sentinel = 'stale';
	if (key === 'bound') key = 'stale';
	tainted = true;
	if (enabled) owed = true;
};

// The Keychain loses the sentinel (restore to a new device, keychain reset).
export const keychainLosesSentinel = () => {
	if (pc === 'checking' || sentinel === 'absent') return;
	sentinel = 'absent';
	tainted = true;
	if (enabled) owed = true;
};

/** Biometry is on only after the user consented in the enable prompt. */
export const enabledOnlyWithConsent = () => !enabled || consented;

/** After the biometric set changes or the sentinel is lost, no biometric prompt unlocks the app until the user re-enables biometry. */
export const noBiometricUnlockAfterTrustLoss = () => !biometricUnlockWhileTainted;

/** After the biometric set changes while biometry is on, the next unlock asks for the passcode even inside the auto-lock window. */
export const trustLossForcesPasscode = () => !windowSkipWhileOwed;

/** The relock marker is cleared only after the user typed the passcode. */
export const relockClearedOnlyAfterPasscode = () => !relockClearedWithoutPasscode;
