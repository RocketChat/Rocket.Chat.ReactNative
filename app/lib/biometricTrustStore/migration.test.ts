import UserPreferences from '../methods/userPreferences';
import log from '../methods/helpers/log';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE, BIOMETRY_ENABLED_KEY } from '../constants/localAuthentication';
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
		enrol: jest.fn(),
		disenrol: jest.fn(),
		verify: jest.fn(),
		probeExists: jest.fn()
	}
}));

const mockedGetBool = UserPreferences.getBool as jest.Mock;
const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedEnrol = biometricTrustStore.enrol as jest.Mock;
const mockedProbeExists = biometricTrustStore.probeExists as jest.Mock;
const mockedLog = log as unknown as jest.Mock;

// Drives the mocked UserPreferences with the values the migration needs to see for the
// branch under test, so each test reads like a state machine input row.
const setPrefs = ({ biometryEnabled, migrated }: { biometryEnabled: boolean; migrated: boolean }) => {
	mockedGetBool.mockImplementation((key: string) => {
		if (key === BIOMETRY_ENABLED_KEY) return biometryEnabled;
		if (key === BIOMETRIC_TRUST_MIGRATION_V1_DONE) return migrated;
		return undefined;
	});
};

describe('runBiometricTrustMigration', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('upgrade path: !migrated && flag && !sentinel → enrol() once and mark migrated', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedProbeExists.mockResolvedValueOnce(false);
		mockedEnrol.mockResolvedValueOnce({ kind: 'success' });

		await runBiometricTrustMigration();

		expect(mockedEnrol).toHaveBeenCalledTimes(1);
		expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRY_ENABLED_KEY, false);
	});

	it('reconciliation path: migrated && flag && !sentinel → clear flag, no enrol()', async () => {
		setPrefs({ biometryEnabled: true, migrated: true });
		mockedProbeExists.mockResolvedValueOnce(false);

		await runBiometricTrustMigration();

		expect(mockedEnrol).not.toHaveBeenCalled();
		expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRY_ENABLED_KEY, false);
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
	});

	it('flag=false → no-op (no probe, no enrol, no setBool)', async () => {
		setPrefs({ biometryEnabled: false, migrated: false });

		await runBiometricTrustMigration();

		expect(mockedProbeExists).not.toHaveBeenCalled();
		expect(mockedEnrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('flag=true && sentinel exists → no-op (no enrol, no flag clear)', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedProbeExists.mockResolvedValueOnce(true);

		await runBiometricTrustMigration();

		expect(mockedEnrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('idempotent: after successful migration, second run is a no-op', async () => {
		// first run: upgrade path
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedProbeExists.mockResolvedValueOnce(false);
		mockedEnrol.mockResolvedValueOnce({ kind: 'success' });
		await runBiometricTrustMigration();
		expect(mockedEnrol).toHaveBeenCalledTimes(1);

		// second run: sentinel now exists AND marker is set
		jest.clearAllMocks();
		setPrefs({ biometryEnabled: true, migrated: true });
		mockedProbeExists.mockResolvedValueOnce(true);

		await runBiometricTrustMigration();

		expect(mockedEnrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('enrol() error → logged, flag untouched, marker NOT set so next boot retries', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		mockedProbeExists.mockResolvedValueOnce(false);
		const cause = new Error('keychain unavailable');
		mockedEnrol.mockResolvedValueOnce({ kind: 'error', cause });

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(cause);
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, expect.anything());
		expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRY_ENABLED_KEY, false);
	});

	it('probeExists throws → swallowed, logged, no enrol(), no flag mutation', async () => {
		setPrefs({ biometryEnabled: true, migrated: false });
		const boom = new Error('probe failed');
		mockedProbeExists.mockRejectedValueOnce(boom);

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(boom);
		expect(mockedEnrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});
});
