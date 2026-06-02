import { type TrustResult } from '../../definitions';
import { biometricTrustStore } from './index';

export type BiometricInvalidationReason = 'enrollmentChanged';

export type BiometricModalRequest = {
	hasBiometry: boolean;
	skipAutoBiometry?: boolean;
	reason?: BiometricInvalidationReason;
};

// Discriminated on `unlocked`: a locked outcome always carries the modal config to show next, an
// unlocked one never does. Narrowing on `unlocked` (without destructuring) makes `modal` present.
export type BiometricTrustOutcome = { unlocked: true } | { unlocked: false; modal: BiometricModalRequest };

// Shared invalidation + modal-config resolution for both Option C call sites:
// - handleLocalAuthentication (upstream verify() preflight)
// - PasscodeEnter biometry button retry
//
// On enrollmentChanged we MUST disenrol() before disabling biometry so a crash between the two
// leaves the app in a state slice 04's reconciliation can still clean up — a flipped flag with a
// live sentinel would otherwise look like a healthy enrolment.
export const resolveBiometricTrust = async (result: TrustResult): Promise<BiometricTrustOutcome> => {
	switch (result.kind) {
		case 'success':
			return { unlocked: true };
		case 'enrollmentChanged':
			await biometricTrustStore.disenrol();
			biometricTrustStore.setEnabled(false);
			return { unlocked: false, modal: { hasBiometry: false, reason: 'enrollmentChanged' } };
		case 'unavailable':
			return { unlocked: false, modal: { hasBiometry: false } };
		case 'canceled':
		case 'error':
		default:
			return { unlocked: false, modal: { hasBiometry: true, skipAutoBiometry: true } };
	}
};
