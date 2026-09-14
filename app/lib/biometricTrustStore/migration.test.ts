import log from '../methods/helpers/log';
import { biometricTrustStore } from './index';
import { runBiometricTrustMigration } from './migration';

jest.mock('../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('./index', () => ({
	biometricTrustStore: {
		enroll: jest.fn(),
		disenroll: jest.fn(),
		verify: jest.fn(),
		hasEnrollment: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		disableBiometry: jest.fn(),
		invalidate: jest.fn(),
		isRelockPending: jest.fn(),
		setRelockPending: jest.fn()
	}
}));

const mockedEnroll = biometricTrustStore.enroll as jest.Mock;
const mockedHasEnrollment = biometricTrustStore.hasEnrollment as jest.Mock;
const mockedIsEnabled = biometricTrustStore.isEnabled as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedInvalidate = biometricTrustStore.invalidate as jest.Mock;
const mockedLog = log as unknown as jest.Mock;

describe('runBiometricTrustMigration', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedInvalidate.mockResolvedValue(undefined);
	});

	// Covers both entry states that reach it: the pre-feature upgrade and a sentinel the OS dropped
	// after an enrollment change. Neither leaves a baseline worth trusting.
	it('flag on with no sentinel → invalidate(), never enroll()', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);

		await runBiometricTrustMigration();

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(mockedEnroll).not.toHaveBeenCalled();
	});

	it('flag=false → no-op (no enrollment check, no invalidate)', async () => {
		mockedIsEnabled.mockReturnValue(false);

		await runBiometricTrustMigration();

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('flag=true && sentinel exists → no-op', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(true);

		await runBiometricTrustMigration();

		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('idempotent: the run after the flag is cleared is a no-op', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);
		await runBiometricTrustMigration();
		expect(mockedInvalidate).toHaveBeenCalledTimes(1);

		jest.clearAllMocks();
		// invalidate() cleared the enabled flag, so the next launch returns on the first guard.
		mockedIsEnabled.mockReturnValue(false);

		await runBiometricTrustMigration();

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
		expect(mockedInvalidate).not.toHaveBeenCalled();
	});

	it('hasEnrollment throws → swallowed, logged, flag untouched', async () => {
		mockedIsEnabled.mockReturnValue(true);
		const boom = new Error('enrollment check failed');
		mockedHasEnrollment.mockRejectedValueOnce(boom);

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(boom);
		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	// invalidate() clears the enabled flag in a finally, so a throw still leaves biometry off — but the
	// migration must not take the app down with it either way.
	it('invalidate throws → swallowed and logged', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);
		const boom = new Error('keychain unavailable');
		mockedInvalidate.mockRejectedValueOnce(boom);

		await runBiometricTrustMigration();

		expect(mockedLog).toHaveBeenCalledWith(boom);
	});
});
