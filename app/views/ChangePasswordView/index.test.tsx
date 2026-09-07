import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch } from 'react-redux';

import ChangePasswordView from './index';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { saveUserProfile } from '../../lib/services/restApi';
import { twoFactor } from '../../lib/services/twoFactor/twoFactor';
import { TwoFactorCancelledError } from '../../lib/services/twoFactor/twoFactorCancelled';
import handleSaveUserProfileError from '../../lib/methods/helpers/handleSaveUserProfileError';
import { TwoFactorMethods } from '../../definitions/ITotp';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn()
}));

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	saveUserProfile: jest.fn(),
	setPassword: jest.fn()
}));

jest.mock('../../lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../lib/methods/helpers/handleSaveUserProfileError', () => jest.fn());

jest.mock('../../lib/hooks/useVerifyPassword', () => () => ({ isPasswordValid: true, passwordPolicies: null }));

jest.mock('react-native-keyboard-controller', () => {
	const { View } = require('react-native');
	return { KeyboardAvoidingView: View };
});

const user = {
	id: 'user-id',
	username: 'john.doe',
	emails: [{ address: 'john@rocket.chat', verified: true }]
};

const buildState = () => ({
	login: { user },
	server: { server: 'https://open.rocket.chat' },
	settings: {
		Accounts_AllowPasswordChange: true,
		Accounts_RequirePasswordConfirmation: true
	}
});

const navigation = {
	setOptions: jest.fn(),
	goBack: jest.fn(),
	getState: () => ({ routes: [{ name: 'ProfileView' }] })
} as any;

const totpInvalid = { error: 'totp-invalid', details: { method: TwoFactorMethods.TOTP } };

const renderChangePassword = () => {
	(useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => unknown) => selector(buildState()));
	return render(<ChangePasswordView navigation={navigation} />);
};

const fillAndSubmit = (getByTestId: (id: string) => any) => {
	fireEvent.changeText(getByTestId('change-password-view-current-password'), 'current-password');
	fireEvent.changeText(getByTestId('change-password-view-new-password'), 'new-password');
	fireEvent.changeText(getByTestId('change-password-view-confirm-new-password'), 'new-password');
	fireEvent.press(getByTestId('change-password-view-set-new-password-button'));
};

beforeEach(() => {
	jest.clearAllMocks();
	(useDispatch as jest.Mock).mockReturnValue(jest.fn());
});

describe('ChangePasswordView two-factor', () => {
	it('clears the current password and the stored code when the user cancels the 2FA prompt', async () => {
		(saveUserProfile as jest.Mock).mockRejectedValue(totpInvalid);
		(twoFactor as jest.Mock)
			.mockResolvedValueOnce({ twoFactorCode: '123456', twoFactorMethod: TwoFactorMethods.TOTP })
			.mockRejectedValue(new TwoFactorCancelledError());

		const { getByTestId } = renderChangePassword();
		fillAndSubmit(getByTestId);

		await waitFor(() => expect(twoFactor).toHaveBeenCalledTimes(2));
		expect(getByTestId('change-password-view-current-password').props.value).toBe('');

		fillAndSubmit(getByTestId);

		await waitFor(() => expect(twoFactor).toHaveBeenCalledTimes(3));
		expect((twoFactor as jest.Mock).mock.calls[2][0]).toEqual(expect.objectContaining({ invalid: false }));
		expect(handleSaveUserProfileError).not.toHaveBeenCalled();
	});

	it('reports the two-factor failure instead of the original totp-invalid error', async () => {
		const twoFactorFailure = new Error('two-factor prompt blew up');
		(saveUserProfile as jest.Mock).mockRejectedValue(totpInvalid);
		(twoFactor as jest.Mock).mockRejectedValue(twoFactorFailure);

		const { getByTestId } = renderChangePassword();
		fillAndSubmit(getByTestId);

		await waitFor(() => expect(handleSaveUserProfileError).toHaveBeenCalledWith(twoFactorFailure, 'saving_profile'));
	});
});
