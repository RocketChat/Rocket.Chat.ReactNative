import * as Keychain from 'react-native-keychain';

import { biometricTrustStore, classifyError } from './index';
import { clearEnrollmentKey, bindEnrollmentKey, isEnrollmentValid } from './nativeEnrollmentCheck';
import UserPreferences from '../methods/userPreferences';
import {
	BIOMETRIC_TRUST_MIGRATION_V1_DONE,
	BIOMETRIC_TRUST_SENTINEL_SERVICE as SENTINEL_SERVICE
} from '../constants/localAuthentication';

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: { getBool: jest.fn(), setBool: jest.fn(), getString: jest.fn(), setString: jest.fn() }
}));

// Getter, not a literal: the storage downgrade guard is Android-only, and the platform has to be
// switchable per test.
let mockIsAndroid = false;
jest.mock('../methods/helpers/deviceInfo', () => ({
	get isAndroid() {
		return mockIsAndroid;
	},
	get isIOS() {
		return !mockIsAndroid;
	}
}));

jest.mock('./nativeEnrollmentCheck', () => ({
	bindEnrollmentKey: jest.fn(() => Promise.resolve(true)),
	clearEnrollmentKey: jest.fn(() => Promise.resolve()),
	isEnrollmentValid: jest.fn(() => Promise.resolve(true))
}));

const mockedKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedBindEnrollmentKey = bindEnrollmentKey as jest.Mock;
const mockedClearEnrollmentKey = clearEnrollmentKey as jest.Mock;
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

		it('does not bind the native enrollment key when the sentinel write fails', async () => {
			mockedKeychain.setGenericPassword.mockRejectedValueOnce(new Error('errSecUserCancel'));

			await biometricTrustStore.enroll();

			expect(mockedBindEnrollmentKey).not.toHaveBeenCalled();
		});

		it('classifies setGenericPassword failures and leaves the marker untouched', async () => {
			mockedKeychain.setGenericPassword.mockRejectedValueOnce(new Error('errSecUserCancel'));
			expect(await biometricTrustStore.enroll()).toEqual({ kind: 'canceled' });
			expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
		});

		it('reports unavailable when the write resolves false', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce(false as any);

			expect(await biometricTrustStore.enroll()).toEqual({ kind: 'unavailable' });
			expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
			expect(mockedBindEnrollmentKey).not.toHaveBeenCalled();
		});

		// Android with no strong biometric: react-native-keychain writes to a non-authenticated storage
		// instead of failing, producing a sentinel that can never detect an enrollment change.
		describe('Android storage downgrade', () => {
			beforeEach(() => {
				mockIsAndroid = true;
			});
			afterEach(() => {
				mockIsAndroid = false;
			});

			it.each([Keychain.STORAGE_TYPE.AES_CBC, Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH])(
				'rejects a sentinel written to %s and tears it back down',
				async storage => {
					mockedKeychain.setGenericPassword.mockResolvedValueOnce({ service: SENTINEL_SERVICE, storage } as any);

					expect(await biometricTrustStore.enroll()).toEqual({ kind: 'unavailable' });
					expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1);
					expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
					expect(mockedBindEnrollmentKey).not.toHaveBeenCalled();
				}
			);

			it.each([Keychain.STORAGE_TYPE.AES_GCM, Keychain.STORAGE_TYPE.RSA])('accepts an auth-backed %s sentinel', async storage => {
				mockedKeychain.setGenericPassword.mockResolvedValueOnce({ service: SENTINEL_SERVICE, storage } as any);

				expect(await biometricTrustStore.enroll()).toEqual({ kind: 'success' });
				expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
				expect(mockedBindEnrollmentKey).toHaveBeenCalledTimes(1);
			});
		});

		describe('Android enrollment-key binding', () => {
			beforeEach(() => {
				mockIsAndroid = true;
			});
			afterEach(() => {
				mockIsAndroid = false;
			});

			it('binds the native enrollment key in lockstep with the sentinel', async () => {
				mockedKeychain.setGenericPassword.mockResolvedValueOnce({
					service: SENTINEL_SERVICE,
					storage: Keychain.STORAGE_TYPE.AES_GCM
				} as any);

				expect(await biometricTrustStore.enroll()).toEqual({ kind: 'success' });
				expect(mockedBindEnrollmentKey).toHaveBeenCalledTimes(1);
			});

			// The enrollment key is the sole gate on a warm auto-lock unlock, so enabling biometry without one
			// would hand the user a bogus "enrollment changed" teardown on the next unlock.
			it('refuses to enable biometry when the enrollment key cannot be bound, and tears the sentinel down', async () => {
				mockedKeychain.setGenericPassword.mockResolvedValueOnce({
					service: SENTINEL_SERVICE,
					storage: Keychain.STORAGE_TYPE.AES_GCM
				} as any);
				mockedBindEnrollmentKey.mockResolvedValueOnce(false);

				expect(await biometricTrustStore.enroll()).toEqual({ kind: 'unavailable' });
				expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1);
				// Marker left set would block the migration's grandfather rescue on every later launch.
				expect(mockedSetBool).not.toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
			});
		});

		it("accepts iOS's 'keychain' storage, which has no downgrade fallback", async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce({ service: SENTINEL_SERVICE, storage: 'keychain' } as any);

			expect(await biometricTrustStore.enroll()).toEqual({ kind: 'success' });
		});

		// There is no iOS enrollment key and its fallback resolves false, so the check stays behind isAndroid.
		it('does not consult the enrollment key on iOS', async () => {
			mockedKeychain.setGenericPassword.mockResolvedValueOnce({ service: SENTINEL_SERVICE, storage: 'keychain' } as any);
			mockedBindEnrollmentKey.mockResolvedValueOnce(false);

			expect(await biometricTrustStore.enroll()).toEqual({ kind: 'success' });
			expect(mockedBindEnrollmentKey).not.toHaveBeenCalled();
			expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRIC_TRUST_MIGRATION_V1_DONE, true);
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

		it('tears down the Android native enrollment key alongside the sentinel', async () => {
			mockedKeychain.resetGenericPassword.mockResolvedValueOnce(true as any);

			await biometricTrustStore.disenroll();

			expect(mockedClearEnrollmentKey).toHaveBeenCalledTimes(1);
		});

		it('still tears down the native enrollment key even when the sentinel delete throws', async () => {
			mockedKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('not found'));

			await biometricTrustStore.disenroll();

			expect(mockedClearEnrollmentKey).toHaveBeenCalledTimes(1);
		});
	});

	describe('invalidate', () => {
		it('arms the relock debt first, then disenrolls, then clears the flag — the security-critical order', async () => {
			const order: string[] = [];
			const setRelockPending = jest.spyOn(biometricTrustStore, 'setRelockPending').mockImplementation((v: boolean) => {
				order.push(`relockPending:${v}`);
			});
			const disenroll = jest.spyOn(biometricTrustStore, 'disenroll').mockImplementation(() => {
				order.push('disenroll');
				return Promise.resolve();
			});
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {
				order.push('setEnabled:false');
			});

			await biometricTrustStore.invalidate();

			// Debt persisted BEFORE teardown so a kill mid-invalidation still carries it forward; disenroll
			// before flag-clear so a crash leaves a reconcilable mismatch, never an orphaned live sentinel.
			expect(order).toEqual(['relockPending:true', 'disenroll', 'setEnabled:false']);
			expect(setRelockPending).toHaveBeenCalledWith(true);
			expect(setEnabled).toHaveBeenCalledWith(false);
			expect(disenroll).toHaveBeenCalledTimes(1);

			setRelockPending.mockRestore();
			disenroll.mockRestore();
			setEnabled.mockRestore();
		});

		it('still clears the flag when disenroll rejects (best-effort teardown must complete)', async () => {
			jest.spyOn(biometricTrustStore, 'setRelockPending').mockImplementation(() => {});
			jest.spyOn(biometricTrustStore, 'disenroll').mockRejectedValueOnce(new Error('boom'));
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			await expect(biometricTrustStore.invalidate()).rejects.toThrow('boom');

			expect(setEnabled).toHaveBeenCalledWith(false);
			jest.restoreAllMocks();
		});
	});

	describe('isEnrollmentValid', () => {
		it('delegates to the native enrollment key (true → valid)', async () => {
			mockedIsEnrollmentValid.mockResolvedValueOnce(true);
			expect(await biometricTrustStore.isEnrollmentValid()).toBe(true);
		});

		it('delegates to the native enrollment key (false → Android enrollment changed)', async () => {
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

		it('rejects when the silent check throws', async () => {
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

		it('returns error when the silent check throws', async () => {
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
			// `cancel` is deliberately absent: the iOS read path forwards only the title.
			expect(options).toMatchObject({ authenticationPrompt: { title: 'Authenticate' } });
			expect((options as { authenticationPrompt?: Record<string, unknown> }).authenticationPrompt).not.toHaveProperty('cancel');
		});
	});

	describe('disableBiometry', () => {
		it('disenrolls then persists the flag as disabled', async () => {
			const enroll = jest.spyOn(biometricTrustStore, 'enroll');
			const disenroll = jest.spyOn(biometricTrustStore, 'disenroll').mockResolvedValueOnce();
			const setEnabled = jest.spyOn(biometricTrustStore, 'setEnabled').mockImplementation(() => {});

			await biometricTrustStore.disableBiometry();

			expect(enroll).not.toHaveBeenCalled();
			expect(disenroll).toHaveBeenCalledTimes(1);
			expect(setEnabled).toHaveBeenCalledWith(false);
		});
	});
});
