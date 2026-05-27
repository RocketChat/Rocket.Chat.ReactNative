import UserPreferences from '../methods/userPreferences';
import { BIOMETRY_ENABLED_KEY } from '../constants/localAuthentication';
import { biometricTrustStore, type TrustResult } from './index';

export type BiometricInvalidationReason = 'enrollmentChanged';

export type BiometricModalRequest = {
	hasBiometry: boolean;
	skipAutoBiometry?: boolean;
	reason?: BiometricInvalidationReason;
};

export type BiometricTrustOutcome = {
	unlocked: boolean;
	modal?: BiometricModalRequest;
};

// Shared invalidation + modal-config resolution for both Option C call sites:
// - handleLocalAuthentication (upstream verify() preflight)
// - PasscodeEnter biometry button retry
//
// On enrollmentChanged we MUST disenrol() before clearing BIOMETRY_ENABLED_KEY so a crash between
// the two leaves the app in a state slice 04's reconciliation can still clean up — a flipped flag
// with a live sentinel would otherwise look like a healthy enrolment.
export const handleBiometricTrustResult = async (result: TrustResult): Promise<BiometricTrustOutcome> => {
	switch (result.kind) {
		case 'success':
			return { unlocked: true };
		case 'enrollmentChanged':
			await biometricTrustStore.disenrol();
			UserPreferences.setBool(BIOMETRY_ENABLED_KEY, false);
			return { unlocked: false, modal: { hasBiometry: false, reason: 'enrollmentChanged' } };
		case 'unavailable':
			return { unlocked: false, modal: { hasBiometry: false } };
		case 'canceled':
		case 'error':
		default:
			return { unlocked: false, modal: { hasBiometry: true, skipAutoBiometry: true } };
	}
};
