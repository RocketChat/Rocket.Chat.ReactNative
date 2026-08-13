import UserPreferences from '../methods/userPreferences';
import log from '../methods/helpers/log';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE } from '../constants/localAuthentication';
import { biometricTrustStore } from './index';
import { runBiometricTrustMigration } from './migration';

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn(),
		setBool: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn()
	}
}));

jest.mock('../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('./index', () => ({
	biometricTrustStore: {
		enroll: jest.fn(),
		disenroll: jest.fn(),
		verify: jest.fn(),
		hasEnrollment: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		setBiometryEnabled: jest.fn(),
		isRelockPending: jest.fn(),
		setRelockPending: jest.fn()
	}
}));

const mockedGetBool = UserPreferences.getBool as jest.Mock;
const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedEnroll = biometricTrustStore.enroll as jest.Mock;
const mockedHasEnrollment = biometricTrustStore.hasEnrollment as jest.Mock;
const mockedIsEnabled = biometricTrustStore.isEnabled as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedSetRelockPending = biometricTrustStore.setRelockPending as jest.Mock;
const mockedLog = log as unknown as jest.Mock;

// Drives the biometry-enabled flag and migration marker the migration needs to see for the
// branch under test, so each test reads like a state machine input row.
const setPrefs = ({ biometryEnabled, migrated }: { biometryEnabled: boolean; migrated: boolean }) => {
	mockedIsEnabled.mockReturnValue(biometryEnabled);
	mockedGetBool.mockImplementation((key: string) => {
		if (key === BIOMETRIC_TRUST_MIGRATION_V1_DONE) return migrated;
		return undefined;
	});
};

describe('runBiometricTrustMigration', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('upgrade path: !migrated && flag && !sentinel → force relock, enroll() once', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(false);
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });

		await runBiometricTrustMigration();

		expect(mockedEnroll).toHaveBeenCalledTimes(1);
		// The migration marker is enroll()'s to persist (see index.ts), not the migration's.
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		// The grandfathered enrollment is untrusted (no prior baseline to compare against), so the
		// freshly-bound baseline must be confirmed by a passcode on the next unlock before it is trusted.
		expect(mockedSetRelockPending).toHaveBeenCalledWith(true);
	});

	// The relock debt must be durable before enroll() makes the baseline trustable: enroll() persists the
	// sentinel and the migration marker before it resolves, so a kill after it but before the marker would
	// strand a trusted, possibly attacker-inclusive baseline that no later run forces a passcode for.
	it('grandfather path: relock is armed before enroll() binds the baseline', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(false);
		// Recorded rather than asserted inside the mock: the migration wraps everything in a try/catch, so
		// a failing expect() thrown from enroll() would be swallowed and the test would pass either way.
		const order: string[] = [];
		mockedSetRelockPending.mockImplementationOnce(() => order.push('relock'));
		mockedEnroll.mockImplementationOnce(() => {
			order.push('enroll');
			return Promise.resolve({ kind: 'success' });
		});

		await runBiometricTrustMigration();

		expect(order).toEqual(['relock', 'enroll']);
	});

	it('grandfather enroll() failure → relock stays armed (self-clears on the next forced unlock)', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(false);
		mockedEnroll.mockResolvedValueOnce({ kind: 'error', cause: new Error('keychain unavailable') });

		await runBiometricTrustMigration();

		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
		expect(mockedSetRelockPending).toHaveBeenCalledWith(true);
	});

	it('reconciliation path: migrated && flag && !sentinel → clear flag, mark relock pending, no enroll()', async () => {
		setPrefs({ biometryEnabled: true, migrated: true });
		mockedHasEnrollment.mockResolvedValueOnce(false);

		await runBiometricTrustMigration();

		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		// The enrollment-change signal would be consumed here, so it must be persisted for the next unlock.
		expect(mockedSetRelockPending).toHaveBeenCalledWith(true);
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
	});

	it('flag=false → no-op (no probe, no enroll, no setBool)', async () => {
		setPrefs({ biometryEnabled: false, migrated: false });

		await runBiometricTrustMigration();

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('flag=true && sentinel exists → no-op (no enroll, no flag clear)', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(true);

		await runBiometricTrustMigration();

		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('idempotent: after successful migration, second run is a no-op', async () => {
		// first run: upgrade path
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(false);
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		await runBiometricTrustMigration();
		expect(mockedEnroll).toHaveBeenCalledTimes(1);

		// second run: sentinel now exists AND marker is set
		jest.clearAllMocks();
		setPrefs({ biometryEnabled: true, migrated: true });
		mockedHasEnrollment.mockResolvedValueOnce(true);

		await runBiometricTrustMigration();

		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('enroll() error → logged, flag untouched, marker NOT set so next boot retries', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedHasEnrollment.mockResolvedValueOnce(false);
		const cause = new Error('keychain unavailable');
		mockedEnroll.mockResolvedValueOnce({ kind: 'error', cause });

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(cause);
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('hasEnrollment throws → swallowed, logged, no enroll(), no flag mutation', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		const boom = new Error('probe failed');
		mockedHasEnrollment.mockRejectedValueOnce(boom);

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(boom);
		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});
});
