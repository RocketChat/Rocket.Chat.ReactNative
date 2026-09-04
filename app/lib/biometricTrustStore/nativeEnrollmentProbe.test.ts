import NativeBiometricEnrollment from '../native/NativeBiometricEnrollment';
import { disenrollProbe, enrollProbe, isEnrollmentValid } from './nativeEnrollmentProbe';

jest.mock('../native/NativeBiometricEnrollment', () => ({
	__esModule: true,
	default: {
		enrollProbe: jest.fn(),
		disenrollProbe: jest.fn(),
		isEnrollmentValid: jest.fn()
	}
}));

const mockedNative = NativeBiometricEnrollment as jest.Mocked<typeof NativeBiometricEnrollment>;

describe('nativeEnrollmentProbe', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('enrollProbe', () => {
		it('passes the native verdict through', async () => {
			mockedNative.enrollProbe.mockResolvedValueOnce(true);
			expect(await enrollProbe()).toBe(true);

			mockedNative.enrollProbe.mockResolvedValueOnce(false);
			expect(await enrollProbe()).toBe(false);
		});

		// Swallowing this as a success would leave no probe key, which the next warm unlock reads as
		// an enrollment change and tears biometry down for a change that never happened.
		it('reports false when the bridge rejects', async () => {
			mockedNative.enrollProbe.mockRejectedValueOnce(new Error('module unavailable'));
			expect(await enrollProbe()).toBe(false);
		});
	});

	describe('disenrollProbe', () => {
		it('swallows a rejection: the key may already be gone', async () => {
			mockedNative.disenrollProbe.mockRejectedValueOnce(new Error('module unavailable'));
			await expect(disenrollProbe()).resolves.toBeUndefined();
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
