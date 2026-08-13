import UserPreferences from '../methods/userPreferences';
import log from '../methods/helpers/log';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE } from '../constants/localAuthentication';
import { biometricTrustStore } from './index';

// One-shot upgrade for users who had biometry enabled before the sentinel existed. Runs at app init.
// Truth table and rationale in docs/ARCHITECTURE.md.
export const runBiometricTrustMigration = async (): Promise<void> => {
	try {
		const biometryEnabled = biometricTrustStore.isEnabled();
		if (!biometryEnabled) {
			return;
		}

		const sentinelExists = await biometricTrustStore.hasEnrollment();
		if (sentinelExists) {
			return;
		}

		const migrated = UserPreferences.getBool(BIOMETRIC_TRUST_MIGRATION_V1_DONE) ?? false;

		if (!migrated) {
			// Arm the relock debt before enroll() binds the baseline, so a crash in between can't strand a trusted baseline with no debt recorded.
			biometricTrustStore.setRelockPending(true);
			const result = await biometricTrustStore.enroll();
			if (result.kind === 'error') {
				log(result.cause);
			}
			return;
		}

		// Sentinel gone with the marker set means the enrollment changed. This runs before
		// localAuthenticate, so persist the signal rather than swallowing it.
		biometricTrustStore.setEnabled(false);
		biometricTrustStore.setRelockPending(true);
	} catch (e) {
		log(e);
	}
};
