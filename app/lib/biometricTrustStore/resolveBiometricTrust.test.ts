import UserPreferences from '../methods/userPreferences';
import { BIOMETRY_ENABLED_KEY } from '../constants/localAuthentication';
import { biometricTrustStore } from './index';
import { resolveBiometricTrust } from './resolveBiometricTrust';

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn(),
		setBool: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn()
	}
}));

jest.mock('./index', () => ({
	biometricTrustStore: {
		enrol: jest.fn(),
		disenrol: jest.fn(() => Promise.resolve()),
		verify: jest.fn(),
		probeExists: jest.fn()
	}
}));

const mockedSetBool = UserPreferences.setBool as jest.Mock;
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;

describe('resolveBiometricTrust', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('success → unlocked, no modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'success' });

		expect(outcome).toEqual({ unlocked: true });
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('enrollmentChanged → disenrol() runs before BIOMETRY_ENABLED_KEY is cleared', async () => {
		const order: string[] = [];
		mockedDisenrol.mockImplementation(() => {
			order.push('disenrol');
			return Promise.resolve();
		});
		mockedSetBool.mockImplementation((key: string, value: boolean) => {
			order.push(`setBool:${key}=${value}`);
		});

		const outcome = await resolveBiometricTrust({ kind: 'enrollmentChanged' });

		expect(order).toEqual(['disenrol', `setBool:${BIOMETRY_ENABLED_KEY}=false`]);
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: false, reason: 'enrollmentChanged' }
		});
	});

	it('canceled → no disenrol, no flag clear, modal keeps biometry with skipAutoBiometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'canceled' });

		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true, skipAutoBiometry: true }
		});
	});

	it('error → no disenrol, no flag clear, modal keeps biometry with skipAutoBiometry', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'error', cause: new Error('boom') });

		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(outcome).toEqual({
			unlocked: false,
			modal: { hasBiometry: true, skipAutoBiometry: true }
		});
	});

	it('unavailable → passcode-only modal, no invalidation', async () => {
		const outcome = await resolveBiometricTrust({ kind: 'unavailable' });

		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(outcome).toEqual({ unlocked: false, modal: { hasBiometry: false } });
	});
});
