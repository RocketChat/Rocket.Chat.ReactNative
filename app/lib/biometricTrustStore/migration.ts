import log from '../methods/helpers/log';
import { biometricTrustStore } from './index';

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

		await biometricTrustStore.invalidate();
	} catch (e) {
		log(e);
	}
};
