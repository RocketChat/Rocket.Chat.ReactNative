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
		setBiometryEnabled: jest.fn()
	}
}));

const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedDisenroll = biometricTrustStore.disenroll as jest.Mock;
const mockedSetRelockPending = biometricTrustStore.setRelockPending as jest.Mock;
const mockedInvalidate = biometricTrustStore.invalidate as jest.Mock;

describe('resolveBiometricTrust', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// invalidate() is the single teardown primitive; its ordering is verified in index.test.ts. Here
		// we delegate to the same mocks so the "arm debt → disenroll → clear flag" sequence is observable.
		mockedInvalidate.mockImplementation(async () => {
			biometricTrustStore.setRelockPending(true);
			await biometricTrustStore.disenroll();
			biometricTrustStore.setEnabled(false);
		});
	});

	it('success → unlocked, no modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'success' });

		expect(outcome).toEqual({ unlocked: true });
		expect(mockedInvalidate).not.toHaveBeenCalled();
	});

	it('enrollmentChanged → invalidate() arms the relock debt and disenroll() runs before biometry is disabled', async () => {
		const order: string[] = [];
		mockedSetRelockPending.mockImplementation((value: boolean) => {
			order.push(`relockPending:${value}`);
		});
		mockedDisenroll.mockImplementation(() => {
			order.push('disenroll');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'enrollmentChanged' });

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		// Debt armed BEFORE teardown; disenroll before flag-clear. This is what closes the kill-at-passcode
		// bypass — a force-kill mid-modal still finds the marker set on the next launch.
		expect(order).toEqual(['relockPending:true', 'disenroll', 'setEnabled:false']);
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

	it('unavailable → invalidate() tears down (sentinel gone) and arms relock debt, passcode-only modal, no reason', async () => {
		const order: string[] = [];
		mockedSetRelockPending.mockImplementation((value: boolean) => {
			order.push(`relockPending:${value}`);
		});
		mockedDisenroll.mockImplementation(() => {
			order.push('disenroll');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'unavailable' });

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['relockPending:true', 'disenroll', 'setEnabled:false']);
		expect(outcome).toEqual({ unlocked: false, modal: { hasBiometry: false } });
	});
});
