import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import PasscodeEnter from './PasscodeEnter';
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

// biometry() runs on mount (auto, from behind the modal) and on button press; both share the same
// trust-resolution logic. These cover the auto path plus a manual re-trigger.
describe('PasscodeEnter biometry', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenroll.mockResolvedValue(undefined);
	});

	it('enrollmentChanged on mount → disenrolls, clears flag, hides biometry button', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'enrollmentChanged' });
		const finishProcess = jest.fn();

		const { queryByTestId } = render(<PasscodeEnter hasBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(mockedDisenroll).toHaveBeenCalledTimes(1));
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
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

	it('resyncs mirrored biometry state when props change', async () => {
		const { queryByTestId, queryByText, rerender } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);

		await waitFor(() => expect(queryByTestId('biometry-button')).toBeNull());
		expect(queryByText('Local_authentication_biometric_enrollment_changed')).toBeNull();

		rerender(<PasscodeEnter hasBiometry reason='enrollmentChanged' finishProcess={jest.fn()} />);

		await waitFor(() => expect(queryByTestId('biometry-button')).toBeTruthy());
		expect(queryByText('Local_authentication_biometric_enrollment_changed')).toBeTruthy();
	});
});

describe('PasscodeEnter enrollmentChanged subtitle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders explanatory subtitle when reason === "enrollmentChanged"', () => {
		const { getByText } = render(<PasscodeEnter hasBiometry={false} reason='enrollmentChanged' finishProcess={jest.fn()} />);

		expect(getByText('Local_authentication_biometric_enrollment_changed')).toBeTruthy();
	});

	it('does not render subtitle when reason is undefined', () => {
		const { queryByText } = render(<PasscodeEnter hasBiometry={false} finishProcess={jest.fn()} />);

		expect(queryByText('Local_authentication_biometric_enrollment_changed')).toBeNull();
	});
});
