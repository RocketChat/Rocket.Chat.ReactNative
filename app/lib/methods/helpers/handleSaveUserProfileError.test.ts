import { Alert } from 'react-native';

import handleSaveUserProfileError from './handleSaveUserProfileError';
import { TwoFactorCancelledError } from '../../services/twoFactor/twoFactorCancelled';

jest.mock('../../../i18n', () => ({
	t: (key: string) => key,
	isTranslated: () => true
}));

describe('handleSaveUserProfileError', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not alert a two-factor cancellation', () => {
		handleSaveUserProfileError(new TwoFactorCancelledError(), 'saving_profile');
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('still alerts a genuine failure', () => {
		handleSaveUserProfileError({ error: 'error-invalid-password' }, 'saving_profile');
		expect(Alert.alert).toHaveBeenCalled();
	});
});
