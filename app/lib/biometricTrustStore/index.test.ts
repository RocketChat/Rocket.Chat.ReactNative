import * as Keychain from 'react-native-keychain';

import { biometricTrustStore, classifyError } from './index';
import { disenrollProbe, enrollProbe, isEnrollmentValid } from './nativeEnrollmentProbe';
import UserPreferences from '../methods/userPreferences';
import { BIOMETRIC_TRUST_MIGRATION_V1_DONE } from '../constants/localAuthentication';

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: { getBool: jest.fn(), setBool: jest.fn(), getString: jest.fn(), setString: jest.fn() }
}));

jest.mock('./nativeEnrollmentProbe', () => ({
	enrollProbe: jest.fn(() => Promise.resolve()),
	disenrollProbe: jest.fn(() => Promise.resolve()),
	isEnrollmentValid: jest.fn(() => Promise.resolve(true))
}));

const mockedKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedEnrollProbe = enrollProbe as jest.Mock;
const mockedDisenrollProbe = disenrollProbe as jest.Mock;
const mockedIsEnrollmentValid = isEnrollmentValid as jest.Mock;

const promptCopy = { title: 'Authenticate', cancel: 'Cancel' };

describe('biometricTrustStore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('classifyError', () => {
		it('maps Android KeyPermanentlyInvalidatedException to enrollmentChanged', () => {
			expect(classifyError({ message: 'android.security.keystore.KeyPermanentlyInvalidatedException: ...' })).toEqual({
				kind: 'enrollmentChanged'
			});
		});

		it('maps iOS errSecItemNotFound (-25300) to enrollmentChanged', () => {
			expect(classifyError({ code: '-25300', message: 'errSecItemNotFound' })).toEqual({ kind: 'enrollmentChanged' });
		});

		it('maps errSecUserCancel to canceled', () => {
			expect(classifyError({ message: 'errSecUserCancel' })).toEqual({ kind: 'canceled' });
		});

		it('maps Android user cancellation to canceled', () => {
			expect(classifyError({ message: 'AuthenticationCanceled' })).toEqual({ kind: 'canceled' });
		});

		it('maps errSecUserCanceled code -128 to canceled', () => {
			expect(classifyError({ code: -128, message: 'The operation was aborted' })).toEqual({ kind: 'canceled' });
		});

		it('does not classify unrelated errors mentioning -128 in the message as canceled', () => {
			const cause = { code: '-34018', message: 'keychain failed with status -128 in payload' };
			expect(classifyError(cause)).toEqual({ kind: 'error', cause });
		});

		it('falls back to error with original cause for unknown failures', () => {
			const cause = new Error('boom');
			expect(classifyError(cause)).toEqual({ kind: 'error', cause });
		});
	});

	describe('enroll', () => {
		it('writes sentinel with BIOMETRY_CURRENT_SET and WHEN_UNLOCKED_THIS_DEVICE_ONLY', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce(true as any);

			const result = await biometricTrustStore.enroll();

			expect(result).toEqual({ kind: 'success' });
			expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1);
			const [, , options] = mockedKeychain.setGenericPassword.mock.calls[0];
			expect(options).toMatchObject({
				accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
				accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
			});
		});

		it('marks the install trust-initialized on success so the migration grandfather path cannot fire', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.enroll();

			expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
		});

		it('binds the Android native probe in lockstep with the sentinel', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.enroll();

			expect(mockedEnrollProbe).toHaveBeenCalledTimes(1);
		});

		it('does not bind the native probe when the sentinel write fails', async () => {
			mockedKeychain.setGenericPassword.mockRejectedValueOnce(new Error('errSecUserCancel'));

			await biometricTrustStore.enroll();

			expect(mockedEnrollProbe).not.toHaveBeenCalled();
		});

		it('classifies setGenericPassword failures and leaves the marker untouched', async () => {
			mockedKeychain.setGenericPassword.mockRejectedValueOnce(new Error('errSecUserCancel'));
			expect(await biometricTrustStore.enroll()).toEqual({ kind: 'canceled' });
			expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
		});
	});

	describe('disenroll', () => {
		it('deletes the sentinel via resetGenericPassword', async () => {
			mockedKeychain.resetGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.disenroll();

			expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1);
		});

		it('swallows errors so a missing sentinel is not fatal', async () => {
			mockedKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('not found'));
			await expect(biometricTrustStore.disenroll()).resolves.toBeUndefined();
		});

		it('tears down the Android native probe alongside the sentinel', async () => {
			mockedKeychain.resetGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.disenroll();

			expect(mockedDisenrollProbe).toHaveBeenCalledTimes(1);
		});

		it('still tears down the native probe even when the sentinel delete throws', async () => {
			mockedKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('not found'));

			await biometricTrustStore.disenroll();

			expect(mockedDisenrollProbe).toHaveBeenCalledTimes(1);
		});
	});

	describe('isEnrollmentValid', () => {
		it('delegates to the native probe (true → valid)', async () => {
			mockedIsEnrollmentValid.mockResolvedValueOnce(true);
			expect(await biometricTrustStore.isEnrollmentValid()).toBe(true);
		});

		it('delegates to the native probe (false → Android enrollment changed)', async () => {
			mockedIsEnrollmentValid.mockResolvedValueOnce(false);
			expect(await biometricTrustStore.isEnrollmentValid()).toBe(false);
		});
	});

	describe('hasEnrollment', () => {
		it('uses hasGenericPassword and does not prompt', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);

			const exists = await biometricTrustStore.hasEnrollment();

			expect(exists).toBe(true);
			expect(mockedKeychain.hasGenericPassword).toHaveBeenCalledTimes(1);
			expect(mockedKeychain.getGenericPassword).not.toHaveBeenCalled();
		});

		it('rejects when the silent probe throws', async () => {
			mockedKeychain.hasGenericPassword.mockRejectedValueOnce(new Error('broken'));
			await expect(biometricTrustStore.hasEnrollment()).rejects.toThrow('broken');
		});
	});

	describe('verify', () => {
		it('returns unavailable when sentinel does not exist (no prompt)', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(false);

			const result = await biometricTrustStore.verify({ promptCopy });

			expect(result).toEqual({ kind: 'unavailable' });
			expect(mockedKeychain.getGenericPassword).not.toHaveBeenCalled();
		});

		it('returns success when sentinel matches', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);
			mockedKeychain.getGenericPassword.mockResolvedValueOnce({
				service: 'svc',
				username: 'biometric-trust',
				password: 'v1',
				storage: 'keychain'
			} as any);

			const result = await biometricTrustStore.verify({ promptCopy });

			expect(result).toEqual({ kind: 'success' });
		});

		it('returns enrollmentChanged when Android raises KeyPermanentlyInvalidatedException', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);
			mockedKeychain.getGenericPassword.mockRejectedValueOnce(new Error('KeyPermanentlyInvalidatedException'));

			expect(await biometricTrustStore.verify({ promptCopy })).toEqual({ kind: 'enrollmentChanged' });
		});

		it('returns enrollmentChanged when iOS raises errSecItemNotFound after the prompt', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);
			mockedKeychain.getGenericPassword.mockRejectedValueOnce({ code: '-25300', message: 'errSecItemNotFound' });

			expect(await biometricTrustStore.verify({ promptCopy })).toEqual({ kind: 'enrollmentChanged' });
		});

		it('returns canceled when the user dismisses the prompt', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);
			mockedKeychain.getGenericPassword.mockRejectedValueOnce({ message: 'errSecUserCancel' });

			expect(await biometricTrustStore.verify({ promptCopy })).toEqual({ kind: 'canceled' });
		});

		it('returns error when the silent probe throws', async () => {
			const cause = new Error('broken');
			mockedKeychain.hasGenericPassword.mockRejectedValueOnce(cause);

			expect(await biometricTrustStore.verify({ promptCopy })).toEqual({ kind: 'error', cause });
			expect(mockedKeychain.getGenericPassword).not.toHaveBeenCalled();
		});

		it('forwards the prompt copy to keychain', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);
			mockedKeychain.getGenericPassword.mockResolvedValueOnce({
				service: 'svc',
				username: 'biometric-trust',
				password: 'v1',
				storage: 'keychain'
			} as any);

			await biometricTrustStore.verify({ promptCopy });

			const [options] = mockedKeychain.getGenericPassword.mock.calls[0];
			expect(options).toMatchObject({ authenticationPrompt: { title: 'Authenticate', cancel: 'Cancel' } });
		});
	});

	describe('setBiometryEnabled', () => {
		it('enabling: enrolls then persists the flag as enabled', async () => {
			const enroll = jest.spyOn(biometricTrustStore, 'enroll').mockResolvedValueOnce({ kind: 'success' });
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(true);

			expect(result).toEqual({ kind: 'success' });
			expect(enroll).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(true);
		});

		it('enabling: enroll failure forces the flag off and returns the failure', async () => {
			const enroll = jest.spyOn(biometricTrustStore, 'enroll').mockResolvedValueOnce({ kind: 'canceled' });
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(true);

			expect(result).toEqual({ kind: 'canceled' });
			expect(enroll).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(false);
			expect(setEnabled).toHaveBeenCalledTimes(1);
		});

		it('disabling: disenrolls then persists the flag as disabled', async () => {
			const enroll = jest.spyOn(biometricTrustStore, 'enroll');
			const disenroll = jest.spyOn(biometricTrustStore, 'disenroll').mockResolvedValueOnce();
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(false);

			expect(result).toEqual({ kind: 'success' });
			expect(enroll).not.toHaveBeenCalled();
			expect(disenroll).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(false);
		});
	});
});
