import { type BiometricInvalidationReason, type TrustResult } from '../../definitions';
import { biometricTrustStore } from './index';

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
// Invalidation arms the relock debt before teardown (invalidate()'s contract) so a mid-modal
// force-kill can't drop it; cleared only after the passcode is entered.
export const resolveBiometricTrust = async (result: TrustResult): Promise<BiometricTrustOutcome> => {
	switch (result.kind) {
		case 'success':
			return { unlocked: true };
		case 'enrollmentChanged':
			await biometricTrustStore.invalidate();
			return { unlocked: false, modal: { hasBiometry: false, reason: 'enrollmentChanged' } };
		case 'unavailable':
			await biometricTrustStore.invalidate();
			return { unlocked: false, modal: { hasBiometry: false } };
		case 'canceled':
		case 'error':
		default:
			// Keep the biometry button so the user can retry manually; the upstream verify() already
			// prompted, so there's no auto-prompt to suppress here.
			return { unlocked: false, modal: { hasBiometry: true } };
	}
};
