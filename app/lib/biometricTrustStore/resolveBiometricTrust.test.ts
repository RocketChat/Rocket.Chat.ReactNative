import { biometricTrustStore } from './index';
import { resolveBiometricTrust } from './resolveBiometricTrust';

jest.mock('./index', () => ({
	biometricTrustStore: {
		enrol: jest.fn(),
		disenrol: jest.fn(() => Promise.resolve()),
		verify: jest.fn(),
		hasEnrolment: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		setBiometryEnabled: jest.fn()
	}
}));

const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;

describe('resolveBiometricTrust', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('success → unlocked, no modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'success' });

		expect(outcome).toEqual({ unlocked: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('enrollmentChanged → disenrol() runs before biometry is disabled', async () => {
		const order: string[] = [];
		mockedDisenrol.mockImplementation(() => {
			order.push('disenrol');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'enrollmentChanged' });

		expect(order).toEqual(['disenrol', 'setEnabled:false']);
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: false, reason: 'enrollmentChanged' }
		});
	});

	it('canceled → no disenrol, no flag clear, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'canceled' });

		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('error → no disenrol, no flag clear, modal keeps biometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'error', cause: new Error('boom') });

		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true }
		});
	});

	it('unavailable → clears the flag (sentinel gone) before disabling, passcode-only modal, no reason', async () => {
		const order: string[] = [];
		mockedDisenrol.mockImplementation(() => {
			order.push('disenrol');
			return Promise.resolve();
		});
		mockedSetEnabled.mockImplementation((value: boolean) => {
			order.push(`setEnabled:${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'unavailable' });

		expect(order).toEqual(['disenrol', 'setEnabled:false']);
		expect(outcome).toEqual({ unlocked: false, modal: { hasBiometry: false } });
	});
});
