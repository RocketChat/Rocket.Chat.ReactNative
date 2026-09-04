import { type BiometricInvalidationReason, type TrustResult } from '../../definitions';
import { biometricTrustStore } from './index';

export type BiometricModalRequest = {
	hasBiometry: boolean;
	reason?: BiometricInvalidationReason;
};

export type BiometricTrustOutcome = { unlocked: true } | { unlocked: false; modal: BiometricModalRequest };

// Maps a verify() TrustResult to an unlock outcome plus the modal config to show next.
export const resolveBiometricTrust = async (result: TrustResult): Promise<BiometricTrustOutcome> => {
	switch (result.kind) {
		case 'success':
			return { unlocked: true };
		case 'enrollmentChanged':
			await biometricTrustStore.invalidate();
			return { unlocked: false, modal: { hasBiometry: false, reason: 'enrollmentChanged' } };
		case 'unavailable':
			await biometricTrustStore.invalidate();
			return { unlocked: false, modal: { hasBiometry: false, reason: 'trustLost' } };
		// No `default:` — exhaustiveness must break the build on a new TrustResult variant.
		case 'canceled':
		case 'error':
			// Keep the biometry button for a manual retry.
			return { unlocked: false, modal: { hasBiometry: true } };
	}
};
