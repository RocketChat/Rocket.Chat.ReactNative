import { type TrustResult } from '../../definitions';
import { biometricTrustStore } from './index';

export type BiometricInvalidationReason = 'enrollmentChanged';

export type BiometricModalRequest = {
	hasBiometry: boolean;
	reason?: BiometricInvalidationReason;
};

// Discriminated on `unlocked`: a locked outcome always carries the modal config to show next, an
// unlocked one never does. Narrowing on `unlocked` (without destructuring) makes `modal` present.
export type BiometricTrustOutcome = { unlocked: true } | { unlocked: false; modal: BiometricModalRequest };

// Maps a verify() TrustResult to an unlock outcome plus the modal config to show next. Called from
// PasscodeEnter.biometry() for both the auto-prompt (fired behind the modal on mount) and the manual
// retry button.
//
// On any invalidation we MUST disenrol() before clearing the enabled flag: a crash between the two
// then leaves a flag/sentinel mismatch the migration's reconciliation can still clean up, whereas a
// cleared flag with a live sentinel would look like a healthy disabled state and orphan the sentinel.
export const resolveBiometricTrust = async (result: TrustResult): Promise<BiometricTrustOutcome> => {
	switch (result.kind) {
		case 'success':
			return { unlocked: true };
		case 'enrollmentChanged':
			await biometricTrustStore.disenrol();
			biometricTrustStore.setEnabled(false);
			return { unlocked: false, modal: { hasBiometry: false, reason: 'enrollmentChanged' } };
		case 'unavailable':
			// On iOS an enrolment change deletes the sentinel, so verify() returns `unavailable` (via
			// hasEnrolment()) before the errSecItemNotFound read-path can classify it as enrollmentChanged.
			// Either way the flag is now out of sync with a missing sentinel, so clear it here rather than
			// leaving the migration to reconcile it on a later launch. No reason subtitle: `unavailable`
			// can also be benign (e.g. a THIS_DEVICE_ONLY sentinel not restored from a device backup),
			// not necessarily an enrolment change.
			await biometricTrustStore.disenrol();
			biometricTrustStore.setEnabled(false);
			return { unlocked: false, modal: { hasBiometry: false } };
		case 'canceled':
		case 'error':
		default:
			// Keep the biometry button so the user can retry manually; the upstream verify() already
			// prompted, so there's no auto-prompt to suppress here.
			return { unlocked: false, modal: { hasBiometry: true } };
	}
};
