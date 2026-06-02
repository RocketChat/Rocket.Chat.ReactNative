import UserPreferences from '../methods/userPreferences';
import log from '../methods/helpers/log';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE } from '../constants/localAuthentication';
import { biometricTrustStore } from './index';

// One-shot upgrade migration for users who had biometry enabled before the trust-store sentinel
// existed. Runs at app init.
//
// State machine:
//   !migrated && flag && !sentinel → silent enrol(), mark migrated.   (grandfather upgrade path)
//    migrated && flag && !sentinel → clear flag, do NOT enrol().      (reconciliation, e.g. crash
//                                                                      between disenrol() and the
//                                                                      flag-clear during slice 02
//                                                                      invalidation)
//    flag && sentinel               → no-op.
//   !flag                           → no-op.
//
// On enrol() failure the marker is intentionally left unset so the next boot retries; the flag is
// left as-is so the next unlock falls into the `unavailable` branch and asks for the passcode.
export const runBiometricTrustMigration = async (): Promise<void> => {
	try {
		const biometryEnabled = biometricTrustStore.isEnabled();
		if (!biometryEnabled) {
			return;
		}

		const sentinelExists = await biometricTrustStore.probeExists();
		if (sentinelExists) {
			return;
		}

		const migrated = UserPreferences.getBool(BIOMETRIC_TRUST_MIGRATION_V1_DONE) ?? false;

		if (!migrated) {
			const result = await biometricTrustStore.enrol();
			if (result.kind === 'success') {
				UserPreferences.setBool(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
			} else if (result.kind === 'error') {
				log(result.cause);
			}
			return;
		}

		biometricTrustStore.setEnabled(false);
	} catch (e) {
		log(e);
	}
};
