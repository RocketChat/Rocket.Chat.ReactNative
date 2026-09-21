import { biometricTrustStore } from './index';
import { resolveBiometricTrust } from './resolveBiometricTrust';

jest.mock('./index', () => ({
	biometricTrustStore: {
		enroll: jest.fn(),
		disenroll: jest.fn(() => Promise.resolve()),
		verify: jest.fn(),
		hasEnrollment: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		setRelockPending: jest.fn(),
		invalidate: jest.fn(() => Promise.resolve()),
		disableBiometry: jest.fn()
	}
}));

const mockedSetRelockPending = biometricTrustStore.setRelockPending as jest.Mock;
const mockedInvalidate = biometricTrustStore.invalidate as jest.Mock;

describe('resolveBiometricTrust', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('success → unlocked, no modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'success' });

		expect(outcome).toEqual({ unlocked: true });
		expect(mockedInvalidate).not.toHaveBeenCalled();
	});

	it('enrollmentChanged → invalidates trust and returns the passcode-only modal with a reason', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'enrollmentChanged' });

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: false, reason: 'enrollmentChanged' }
		});
	});

	it('canceled → no invalidation, no relock debt, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'canceled' });

		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetRelockPending).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('error → no invalidation, no relock debt, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'error', cause: new Error('boom') });

		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetRelockPending).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('unavailable → invalidates trust, passcode-only modal, neutral reason', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'unavailable' });

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(outcome).toEqual({ unlocked: false, modal: { hasBiometry: false, reason: 'trustLost' } });
	});
});
