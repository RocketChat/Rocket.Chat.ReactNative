import { Alert } from 'react-native';
import bugsnag from '@bugsnag/react-native';

import log from '../../methods/helpers/log';
import { showErrorAlertWithEMessage } from '../../methods/helpers/info';
import handleSaveUserProfileError from '../../methods/helpers/handleSaveUserProfileError';
import { handleLoginErrors } from '../../../views/LoginView/handleLoginErrors';
import { TwoFactorCancelledError } from './twoFactorCancelled';

jest.mock('../../../i18n', () => ({
	t: (key: string) => key,
	isTranslated: () => true
}));

describe('two-factor cancellation', () => {
	const cancelled = new TwoFactorCancelledError();
	const genuineFailure = { data: { error: 'error-invalid-password' } };

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(bugsnag, 'notify').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not report a cancellation to crash logging or the console', () => {
		log(cancelled);
		expect(bugsnag.notify).not.toHaveBeenCalled();
		expect(console.error).not.toHaveBeenCalled();
	});

	it('still reports a genuine failure', () => {
		log(new Error('boom'));
		expect(console.error).toHaveBeenCalled();
	});

	it('does not alert when a cancellation reaches showErrorAlertWithEMessage', () => {
		showErrorAlertWithEMessage(cancelled);
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('still alerts when a genuine failure reaches showErrorAlertWithEMessage', () => {
		showErrorAlertWithEMessage(genuineFailure);
		expect(Alert.alert).toHaveBeenCalled();
	});

	it('does not alert when a cancellation reaches handleSaveUserProfileError', () => {
		handleSaveUserProfileError(cancelled, 'saving_profile');
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('still alerts when a genuine failure reaches handleSaveUserProfileError', () => {
		handleSaveUserProfileError({ error: 'error-invalid-password' }, 'saving_profile');
		expect(Alert.alert).toHaveBeenCalled();
	});

	it('surfaces a generic login error when the login path reports a cancellation', () => {
		expect(handleLoginErrors((cancelled as any).error)).toBe('Login_error');
	});
});
