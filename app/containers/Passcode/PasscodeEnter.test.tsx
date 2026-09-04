import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PasscodeEnter from './PasscodeEnter';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, MAX_ATTEMPTS, PASSCODE_LENGTH } from '../../lib/constants/localAuthentication';
import { biometryAuth } from '../../lib/methods/helpers/localAuthentication';
import { biometricTrustStore } from '../../lib/biometricTrustStore';

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	biometryAuth: jest.fn(),
	resetAttempts: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/biometricTrustStore', () => ({
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

jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn(),
		setBool: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn()
	},
	useUserPreferences: () => [null, jest.fn()]
}));

jest.mock('../../i18n', () => ({ t: (key: string) => key }));

const mockedBiometryAuth = biometryAuth as jest.Mock;
const mockedDisenroll = biometricTrustStore.disenroll as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedSetRelockPending = biometricTrustStore.setRelockPending as jest.Mock;
const mockedInvalidate = biometricTrustStore.invalidate as jest.Mock;

// biometry() runs on mount (auto, from behind the modal) and on button press; both share the same
// trust-resolution logic. These cover the auto path plus a manual re-trigger.
describe('PasscodeEnter biometry', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenroll.mockResolvedValue(undefined);
		// invalidate() is the single teardown primitive (ordering verified in index.test.ts); delegate to
		// the same mocks so the disenroll/flag/relock assertions below still exercise the real sequence.
		mockedInvalidate.mockImplementation(async () => {
			biometricTrustStore.setRelockPending(true);
			await biometricTrustStore.disenroll();
			biometricTrustStore.setEnabled(false);
		});
	});

	it('enrollmentChanged on mount → invalidates (arms relock debt, disenrolls, clears flag), hides biometry button', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'enrollmentChanged' });
		const finishProcess = jest.fn();

		const { queryByTestId } = render(<PasscodeEnter hasBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(mockedInvalidate).toHaveBeenCalledTimes(1));
		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		// The relock debt must be armed here so a force-kill at this passcode screen still forces the
		// passcode on the next cold launch (the flag is now off, so the live check can't re-detect it).
		expect(mockedSetRelockPending).toHaveBeenCalledWith(true);
		// ...and NOT cleared: the passcode has not been entered yet (finishProcess never fired).
		expect(mockedSetRelockPending).not.toHaveBeenCalledWith(false);
		expect(finishProcess).not.toHaveBeenCalled();
		await waitFor(() => expect(queryByTestId('biometry-button')).toBeNull());
	});

	it('success on mount → finishes process, no invalidation', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'success' });
		const finishProcess = jest.fn();

		render(<PasscodeEnter hasBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(finishProcess).toHaveBeenCalledTimes(1));
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
	});

	it('canceled on mount → flag untouched, biometry button stays', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'canceled' });
		const finishProcess = jest.fn();

		const { getByTestId } = render(<PasscodeEnter hasBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(mockedBiometryAuth).toHaveBeenCalledTimes(1));
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(finishProcess).not.toHaveBeenCalled();
		expect(getByTestId('biometry-button')).toBeTruthy();
	});

	it('button press re-triggers verification after a canceled auto-attempt', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'canceled' }).mockResolvedValueOnce({ kind: 'success' });
		const finishProcess = jest.fn();

		const { getByTestId } = render(<PasscodeEnter hasBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(mockedBiometryAuth).toHaveBeenCalledTimes(1));

		fireEvent.press(getByTestId('biometry-button'));

		await waitFor(() => expect(finishProcess).toHaveBeenCalledTimes(1));
		expect(mockedBiometryAuth).toHaveBeenCalledTimes(2);
	});

	it('does not auto-trigger biometry when hasBiometry is false', async () => {
		const { queryByTestId } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);

		await waitFor(() => expect(queryByTestId('biometry-button')).toBeNull());
		expect(mockedBiometryAuth).not.toHaveBeenCalled();
	});
});

describe('PasscodeEnter invalidation subtitle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it.each([
		['enrollmentChanged', 'Local_authentication_biometric_enrollment_changed'],
		['trustLost', 'Local_authentication_biometric_trust_lost'],
		['relockRequired', 'Local_authentication_biometric_relock_required']
	] as const)('renders the %s subtitle', (reason, key) => {
		const { getByText } = render(<PasscodeEnter hasBiometry={false} reason={reason} finishProcess={jest.fn()} />);

		expect(getByText(key)).toBeTruthy();
	});

	it('does not render subtitle when reason is undefined', () => {
		const { queryByText } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);

		expect(queryByText('Local_authentication_biometric_enrollment_changed')).toBeNull();
	});
});

// The stored passcode is null (see the userPreferences mock), so any entered code is a wrong one.
describe('PasscodeEnter failed attempts', () => {
	const enterWrongPasscode = (getByTestId: ReturnType<typeof render>['getByTestId']) => {
		for (let i = 0; i < PASSCODE_LENGTH; i += 1) {
			fireEvent.press(getByTestId('passcode-button-1'));
		}
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		await AsyncStorage.clear();
	});

	it('persists a failure that does not reach the lockout', async () => {
		const { getByTestId } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);
		await waitFor(() => expect(getByTestId('passcode-button-1')).toBeTruthy());

		enterWrongPasscode(getByTestId);

		await waitFor(() => expect(AsyncStorage.getItem(ATTEMPTS_KEY)).resolves.toBe('1'));
		await expect(AsyncStorage.getItem(LOCKED_OUT_TIMER_KEY)).resolves.toBeNull();
	});

	// readStorage seeds the counter from ATTEMPTS_KEY, so a lockout-triggering failure that skipped the
	// write would leave "5" behind and hand a remount a free sixth attempt with no lock.
	it('persists the failure that triggers the lockout, and writes the timer before locking', async () => {
		await AsyncStorage.setItem(ATTEMPTS_KEY, String(MAX_ATTEMPTS - 1));

		const { getByTestId, getByText } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);
		await waitFor(() => expect(getByTestId('passcode-button-1')).toBeTruthy());

		enterWrongPasscode(getByTestId);

		// The locked screen only renders once the timer is readable, which is what the awaited write buys.
		await waitFor(() => expect(getByText('Passcode_app_locked_title')).toBeTruthy());
		await expect(AsyncStorage.getItem(ATTEMPTS_KEY)).resolves.toBe(String(MAX_ATTEMPTS));
		await expect(AsyncStorage.getItem(LOCKED_OUT_TIMER_KEY)).resolves.not.toBeNull();
	});
});
