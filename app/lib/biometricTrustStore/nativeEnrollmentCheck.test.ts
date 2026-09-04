import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';
import { clearEnrollmentKey, bindEnrollmentKey, isEnrollmentValid } from './nativeEnrollmentCheck';

jest.mock('../native/NativeBiometricEnrollment', () => ({
	__esModule: true,
	default: {
		bindEnrollmentKey: jest.fn(),
		clearEnrollmentKey: jest.fn(),
		isEnrollmentValid: jest.fn()
	}
}));

const mockedNative = NativeBiometricEnrollment as jest.Mocked<typeof NativeBiometricEnrollment>;

describe('nativeEnrollmentCheck', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('bindEnrollmentKey', () => {
		it('passes the native verdict through', async () => {
			mockedNative.bindEnrollmentKey.mockResolvedValueOnce(true);
			expect(await bindEnrollmentKey()).toBe(true);

			mockedNative.bindEnrollmentKey.mockResolvedValueOnce(false);
			expect(await bindEnrollmentKey()).toBe(false);
		});

		// Swallowing this as a success would leave no enrollment key, which the next warm unlock reads as
		// an enrollment change and tears biometry down for a change that never happened.
		it('reports false when the bridge rejects', async () => {
			mockedNative.bindEnrollmentKey.mockRejectedValueOnce(new Error('module unavailable'));
			expect(await bindEnrollmentKey()).toBe(false);
		});
	});

	describe('clearEnrollmentKey', () => {
		it('swallows a rejection: the key may already be gone', async () => {
			mockedNative.clearEnrollmentKey.mockRejectedValueOnce(new Error('module unavailable'));
			await expect(clearEnrollmentKey()).resolves.toBeUndefined();
		});
	});

	describe('isEnrollmentValid', () => {
		// The caller turns a rejection into `checkFailed` (passcode, enrollment kept) rather than a
		// permanent teardown, so the rejection has to propagate.
		it('propagates a rejection instead of answering false', async () => {
			const cause = new Error('module unavailable');
			mockedNative.isEnrollmentValid.mockRejectedValueOnce(cause);
			await expect(isEnrollmentValid()).rejects.toBe(cause);
		});

		it('passes the native verdict through', async () => {
			mockedNative.isEnrollmentValid.mockResolvedValueOnce(false);
			expect(await isEnrollmentValid()).toBe(false);
		});
	});
});
