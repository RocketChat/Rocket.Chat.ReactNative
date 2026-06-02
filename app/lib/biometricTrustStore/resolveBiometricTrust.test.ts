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
		setBiometryEnabled: jest.fn()
	}
}));

const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedDisenroll = biometricTrustStore.disenroll as jest.Mock;

describe('resolveBiometricTrust', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('success → unlocked, no modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'success' });

		expect(outcome).toEqual({ unlocked: true });
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('enrollmentChanged → disenroll() runs before biometry is disabled', async () => {
		const order: string[] = [];
		mockedDisenroll.mockImplementation(() => {
			order.push('disenroll');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'enrollmentChanged' });

		expect(order).toEqual(['disenroll', 'setEnabled:false']);
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: false, reason: 'enrollmentChanged' }
		});
	});

	it('canceled → no disenroll, no flag clear, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'canceled' });

		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('error → no disenroll, no flag clear, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'error', cause: new Error('boom') });

		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('unavailable → clears the flag (sentinel gone) before disabling, passcode-only modal, no reason', async () => {
		const order: string[] = [];
		mockedDisenroll.mockImplementation(() => {
			order.push('disenroll');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'unavailable' });

		expect(order).toEqual(['disenroll', 'setEnabled:false']);
		expect(outcome).toEqual({ unlocked: false, modal: { hasBiometry: false } });
	});
});
