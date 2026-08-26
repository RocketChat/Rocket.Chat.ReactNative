import { Alert } from 'react-native';

import { reportError, showErrorAlertWithEMessage } from './info';
import { TwoFactorCancelledError } from '../../services/twoFactor/twoFactorCancelled';

jest.mock('../../../i18n', () => ({
	t: (key: string) => key,
	isTranslated: () => true
}));

describe('info', () => {
	const cancelled = new TwoFactorCancelledError();
	const genuineFailure = { data: { error: 'error-invalid-password' } };

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('showErrorAlertWithEMessage', () => {
		it('does not alert a two-factor cancellation', () => {
			showErrorAlertWithEMessage(cancelled);
			expect(Alert.alert).not.toHaveBeenCalled();
		});

		it('logs and alerts a genuine failure', () => {
			showErrorAlertWithEMessage(genuineFailure);
			expect(Alert.alert).toHaveBeenCalled();
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('reportError', () => {
		it('neither logs nor alerts a two-factor cancellation', () => {
			reportError(cancelled, 'fallback');
			expect(Alert.alert).not.toHaveBeenCalled();
			expect(console.error).not.toHaveBeenCalled();
		});

		it('logs and alerts a genuine failure with the fallback message', () => {
			reportError(new Error('boom'), 'fallback');
			expect(console.error).toHaveBeenCalled();
			expect(Alert.alert).toHaveBeenCalledWith('', 'fallback', expect.anything(), expect.anything());
		});
	});
});
