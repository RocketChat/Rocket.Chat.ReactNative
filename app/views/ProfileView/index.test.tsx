import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch } from 'react-redux';
import { sha256 } from 'js-sha256';

import ProfileView from './index';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { saveUserProfile } from '../../lib/services/restApi';
import { twoFactor } from '../../lib/services/twoFactor/twoFactor';
import { TwoFactorCancelledError } from '../../lib/services/twoFactor/twoFactorCancelled';
import handleSaveUserProfileError from '../../lib/methods/helpers/handleSaveUserProfileError';
import EventEmitter from '../../lib/methods/helpers/events';
import { setUser } from '../../actions/login';
import I18n from '../../i18n';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useFocusEffect: jest.fn()
}));

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	saveUserProfile: jest.fn()
}));

jest.mock('../../lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../../lib/methods/helpers/handleSaveUserProfileError', () => jest.fn());

const mockShowActionSheet = jest.fn();
const mockHideActionSheet = jest.fn();
jest.mock('../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: mockHideActionSheet })
}));

jest.mock('react-native-keyboard-controller', () => {
	const { View } = require('react-native');
	return { KeyboardAvoidingView: View };
});

jest.mock('./components/DeleteAccountActionSheetContent', () => () => null);
jest.mock('./components/ConfirmEmailChangeActionSheetContent', () => () => null);
jest.mock('../../containers/CustomFields', () => () => null);
jest.mock('../../containers/Avatar', () => ({ AvatarWithEdit: () => null }));

const user = {
	id: 'user-id',
	name: 'John Doe',
	username: 'john.doe',
	emails: [{ address: 'john@rocket.chat', verified: true }],
	bio: 'My bio',
	nickname: 'johnny',
	customFields: {}
};

const buildState = () => ({
	login: { user },
	server: { version: '7.0.0' },
	settings: {
		Accounts_AllowEmailChange: true,
		Accounts_AllowPasswordChange: true,
		Accounts_AllowRealNameChange: true,
		Accounts_AllowUserAvatarChange: true,
		Accounts_AllowUsernameChange: true,
		Accounts_CustomFields: '',
		Accounts_AllowDeleteOwnAccount: true,
		UTF8_User_Names_Validation: '[0-9a-zA-Z-_.]+'
	}
});

const navigation = {
	setOptions: jest.fn(),
	navigate: jest.fn()
} as any;

const dispatch = jest.fn();

const renderProfile = () => {
	(useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => unknown) => selector(buildState()));
	return render(<ProfileView navigation={navigation} />);
};

// Make the form dirty + valid so the Save button is enabled, then press it.
const changeNameAndSubmit = (getByTestId: (id: string) => any, newName = 'Jane Doe') => {
	fireEvent.changeText(getByTestId('profile-view-name'), newName);
	fireEvent.press(getByTestId('profile-view-submit'));
};

beforeEach(() => {
	jest.clearAllMocks();
	(useDispatch as jest.Mock).mockReturnValue(dispatch);
});

describe('ProfileView submit', () => {
	it('saves the changed fields and notifies the user on success', async () => {
		(saveUserProfile as jest.Mock).mockResolvedValue(true);
		const emitSpy = jest.spyOn(EventEmitter, 'emit');

		const { getByTestId } = renderProfile();
		changeNameAndSubmit(getByTestId);

		await waitFor(() => expect(saveUserProfile).toHaveBeenCalledWith({ name: 'Jane Doe' }, {}));
		expect(dispatch).toHaveBeenCalledWith(setUser({ ...user, name: 'Jane Doe', customFields: {} }));
		expect(emitSpy).toHaveBeenCalled();
		expect(handleSaveUserProfileError).not.toHaveBeenCalled();
	});

	it('does not save when the username contains invalid characters', async () => {
		const { getByTestId, findByText } = renderProfile();

		fireEvent.changeText(getByTestId('profile-view-username'), 'cygnus b');
		fireEvent.press(getByTestId('profile-view-submit'));

		await findByText(I18n.t('Username_invalid'));
		expect(saveUserProfile).not.toHaveBeenCalled();
	});

	it('saves when the username is corrected to a valid value', async () => {
		(saveUserProfile as jest.Mock).mockResolvedValue(true);

		const { getByTestId } = renderProfile();

		fireEvent.changeText(getByTestId('profile-view-username'), 'cygnus.b');
		fireEvent.press(getByTestId('profile-view-submit'));

		await waitFor(() => expect(saveUserProfile).toHaveBeenCalledWith({ username: 'cygnus.b' }, {}));
	});

	it('asks for the current password before changing the email', async () => {
		const { getByTestId } = renderProfile();

		fireEvent.changeText(getByTestId('profile-view-email'), 'jane@rocket.chat');
		fireEvent.press(getByTestId('profile-view-submit'));

		await waitFor(() => expect(mockShowActionSheet).toHaveBeenCalled());
		expect(saveUserProfile).not.toHaveBeenCalled();
	});

	it('retries the save through the 2FA challenge', async () => {
		(saveUserProfile as jest.Mock)
			.mockRejectedValueOnce({ error: 'totp-invalid', details: { method: 'totp' } })
			.mockResolvedValueOnce(true);
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '123456', twoFactorMethod: 'totp' });

		const { getByTestId } = renderProfile();
		changeNameAndSubmit(getByTestId);

		await waitFor(() => expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false }));
		await waitFor(() => expect(saveUserProfile).toHaveBeenCalledTimes(2));
		expect(handleSaveUserProfileError).not.toHaveBeenCalled();
	});

	it('stays silent when the user cancels the 2FA challenge', async () => {
		(saveUserProfile as jest.Mock).mockRejectedValue({ error: 'totp-invalid', details: { method: 'totp' } });
		(twoFactor as jest.Mock).mockRejectedValue(new TwoFactorCancelledError());

		const { getByTestId } = renderProfile();
		changeNameAndSubmit(getByTestId);

		await waitFor(() => expect(twoFactor).toHaveBeenCalled());
		expect(handleSaveUserProfileError).not.toHaveBeenCalled();
	});

	it('reports the 2FA error itself when the challenge fails for a reason other than cancelling', async () => {
		const twoFactorError = { error: 'totp-required' };
		(saveUserProfile as jest.Mock).mockRejectedValue({ error: 'totp-invalid', details: { method: 'totp' } });
		(twoFactor as jest.Mock).mockRejectedValue(twoFactorError);

		const { getByTestId } = renderProfile();
		changeNameAndSubmit(getByTestId);

		await waitFor(() => expect(handleSaveUserProfileError).toHaveBeenCalledWith(twoFactorError, 'saving_profile'));
	});

	it('handles the save error after a cancelled/non-2FA failure', async () => {
		const error = { error: 'some-other-error' };
		(saveUserProfile as jest.Mock).mockRejectedValue(error);

		const { getByTestId } = renderProfile();
		changeNameAndSubmit(getByTestId);

		await waitFor(() => expect(handleSaveUserProfileError).toHaveBeenCalledWith(error, 'saving_profile'));
		expect(twoFactor).not.toHaveBeenCalled();
	});

	it('hashes the password supplied through the confirm-email action sheet', async () => {
		(saveUserProfile as jest.Mock).mockResolvedValue(true);
		// Capture the onSubmit handler passed to the confirm-email action sheet.
		let confirmOnSubmit: ((password: string) => Promise<void>) | undefined;
		mockShowActionSheet.mockImplementation(({ children }: any) => {
			confirmOnSubmit = children?.props?.onSubmit;
		});

		const { getByTestId } = renderProfile();
		fireEvent.changeText(getByTestId('profile-view-email'), 'jane@rocket.chat');
		fireEvent.press(getByTestId('profile-view-submit'));

		await waitFor(() => expect(confirmOnSubmit).toBeDefined());
		await act(async () => {
			await confirmOnSubmit!('my-secret');
		});

		await waitFor(() =>
			expect(saveUserProfile).toHaveBeenCalledWith({ email: 'jane@rocket.chat', currentPassword: sha256('my-secret') }, {})
		);
		expect(mockHideActionSheet).toHaveBeenCalled();
	});
});
