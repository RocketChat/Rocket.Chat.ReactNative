import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import PasscodeEnter from './PasscodeEnter';
import { biometryAuth } from '../../lib/methods/helpers/localAuthentication';
import { biometricTrustStore } from '../../lib/biometricTrustStore';
import UserPreferences from '../../lib/methods/userPreferences';
import { BIOMETRY_ENABLED_KEY } from '../../lib/constants/localAuthentication';

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	biometryAuth: jest.fn(),
	resetAttempts: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/biometricTrustStore', () => ({
	biometricTrustStore: {
		enrol: jest.fn(),
		disenrol: jest.fn(() => Promise.resolve()),
		verify: jest.fn(),
		probeExists: jest.fn()
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
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;
const mockedSetBool = UserPreferences.setBool as jest.Mock;

describe('PasscodeEnter biometry button', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenrol.mockResolvedValue(undefined);
	});

	it('enrollmentChanged from button press → disenrols, clears flag, hides biometry button', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'enrollmentChanged' });
		const finishProcess = jest.fn();

		const { getByTestId, queryByTestId } = render(<PasscodeEnter hasBiometry skipAutoBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(getByTestId('biometry-button')).toBeTruthy());

		fireEvent.press(getByTestId('biometry-button'));

		await waitFor(() => expect(mockedDisenrol).toHaveBeenCalledTimes(1));
		expect(mockedSetBool).toHaveBeenCalledWith(BIOMETRY_ENABLED_KEY, false);
		expect(finishProcess).not.toHaveBeenCalled();
		await waitFor(() => expect(queryByTestId('biometry-button')).toBeNull());
	});

	it('success from button press → finishes process, no invalidation', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'success' });
		const finishProcess = jest.fn();

		const { getByTestId } = render(<PasscodeEnter hasBiometry skipAutoBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(getByTestId('biometry-button')).toBeTruthy());

		fireEvent.press(getByTestId('biometry-button'));

		await waitFor(() => expect(finishProcess).toHaveBeenCalledTimes(1));
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
	});

	it('canceled from button press → flag untouched, biometry button stays', async () => {
		mockedBiometryAuth.mockResolvedValueOnce({ kind: 'canceled' });
		const finishProcess = jest.fn();

		const { getByTestId } = render(<PasscodeEnter hasBiometry skipAutoBiometry finishProcess={finishProcess} />);

		await waitFor(() => expect(getByTestId('biometry-button')).toBeTruthy());

		fireEvent.press(getByTestId('biometry-button'));

		await waitFor(() => expect(mockedBiometryAuth).toHaveBeenCalled());
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetBool).not.toHaveBeenCalled();
		expect(finishProcess).not.toHaveBeenCalled();
		expect(getByTestId('biometry-button')).toBeTruthy();
	});
});
