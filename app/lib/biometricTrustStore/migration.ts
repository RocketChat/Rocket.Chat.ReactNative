import UserPreferences from '../methods/userPreferences';
import log from '../methods/helpers/log';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE } from '../constants/localAuthentication';
import { biometricTrustStore } from './index';

// One-shot upgrade migration for users who had biometry enabled before the trust-store sentinel
// existed. Runs at app init.
//
// State machine:
//   !migrated && flag && !sentinel → force relock, then enroll().  (grandfather upgrade path)
//    migrated && flag && !sentinel → clear flag, force relock, do NOT enroll().  (reconciliation, e.g.
//                                                                      a crash between disenroll() and
//                                                                      the flag-clear during an
//                                                                      invalidation)
//    flag && sentinel               → no-op.
//   !flag                           → no-op.
//
// On enroll() failure the marker is intentionally left unset so the next boot retries; the flag is
// left as-is so the next unlock falls into the `unavailable` branch and asks for the passcode. The
// relock marker armed up front is left set — it is self-clearing on the next forced unlock.
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

		// migrated && flag && !sentinel: the OS dropped the sentinel because the enrollment set changed
		// (or a deliberate disable crashed mid-way). Clear the flag — and because this migration runs
		// *before* localAuthenticate on cold launch, it would otherwise swallow the enrollment-change
		// signal entirely. Persist a relock marker so the next unlock is forced to demand the passcode
		// regardless of the auto-lock window. See handleLocalAuthentication.
		biometricTrustStore.setEnabled(false);
		biometricTrustStore.setRelockPending(true);
	} catch (e) {
		log(e);
	}
};
