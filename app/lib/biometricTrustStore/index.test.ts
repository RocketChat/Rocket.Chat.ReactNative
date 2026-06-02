import * as Keychain from 'react-native-keychain';

import { biometricTrustStore, classifyError } from './index';

const mockedKeychain = Keychain as jest.Mocked<typeof Keychain>;

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

		it('falls back to error with original cause for unknown failures', () => {
			const cause = new Error('boom');
			expect(classifyError(cause)).toEqual({ kind: 'error', cause });
		});
	});

	describe('enrol', () => {
		it('writes sentinel with BIOMETRY_CURRENT_SET and WHEN_UNLOCKED_THIS_DEVICE_ONLY', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce(true as any);

			const result = await biometricTrustStore.enrol();

			expect(result).toEqual({ kind: 'success' });
			expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1);
			const [, , options] = mockedKeychain.setGenericPassword.mock.calls[0];
			expect(options).toMatchObject({
				accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
				accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
			});
		});

		it('classifies setGenericPassword failures', async () => {
			mockedKeychain.setGenericPassword.mockRejectedValueOnce(new Error('errSecUserCancel'));
			expect(await biometricTrustStore.enrol()).toEqual({ kind: 'canceled' });
		});
	});

	describe('disenrol', () => {
		it('deletes the sentinel via resetGenericPassword', async () => {
			mockedKeychain.resetGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.disenrol();

			expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1);
		});

		it('swallows errors so a missing sentinel is not fatal', async () => {
			mockedKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('not found'));
			await expect(biometricTrustStore.disenrol()).resolves.toBeUndefined();
		});
	});

	describe('hasEnrolment', () => {
		it('uses hasGenericPassword and does not prompt', async () => {
			mockedKeychain.hasGenericPassword.mockResolvedValueOnce(true);

			const exists = await biometricTrustStore.hasEnrolment();

			expect(exists).toBe(true);
			expect(mockedKeychain.hasGenericPassword).toHaveBeenCalledTimes(1);
			expect(mockedKeychain.getGenericPassword).not.toHaveBeenCalled();
		});

		it('returns false when probe throws', async () => {
			mockedKeychain.hasGenericPassword.mockRejectedValueOnce(new Error('broken'));
			expect(await biometricTrustStore.hasEnrolment()).toBe(false);
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
		it('enabling: enrols then persists the flag as enabled', async () => {
			const enrol = jest.spyOn(biometricTrustStore, 'enrol').mockResolvedValueOnce({ kind: 'success' });
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(true);

			expect(result).toEqual({ kind: 'success' });
			expect(enrol).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(true);
		});

		it('enabling: enrol failure forces the flag off and returns the failure', async () => {
			const enrol = jest.spyOn(biometricTrustStore, 'enrol').mockResolvedValueOnce({ kind: 'canceled' });
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(true);

			expect(result).toEqual({ kind: 'canceled' });
			expect(enrol).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(false);
			expect(setEnabled).toHaveBeenCalledTimes(1);
		});

		it('disabling: disenrols then persists the flag as disabled', async () => {
			const enrol = jest.spyOn(biometricTrustStore, 'enrol');
			const disenrol = jest.spyOn(biometricTrustStore, 'disenrol').mockResolvedValueOnce();
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			const result = await biometricTrustStore.setBiometryEnabled(false);

			expect(result).toEqual({ kind: 'success' });
			expect(enrol).not.toHaveBeenCalled();
			expect(disenrol).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(false);
		});
	});
});
