import { Alert } from 'react-native';

import { showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { TwoFactorCancelledError } from '~/lib/services/twoFactor/twoFactorCancelled';

jest.mock('~/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string, options?: { seconds?: string }) => (options?.seconds ? `${key} ${options.seconds}` : `translated:${key}`),
		isTranslated: (key: string) => key === 'error-not-allowed' || key === 'Some_translated_key'
	}
}));

const alertMessage = () => (Alert.alert as jest.Mock).mock.calls[0][1];

describe('showErrorAlertWithEMessage', () => {
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not alert for a cancelled two-factor prompt', () => {
		showErrorAlertWithEMessage(new TwoFactorCancelledError());
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('shows the server reason of a REST error without its bracketed code', () => {
		showErrorAlertWithEMessage({ data: { error: 'User not found [error-user-not-found]', errorType: 'error-user-not-found' } });
		expect(alertMessage()).toBe('User not found');
	});

	it('shows the translation of a REST error whose code is translated', () => {
		showErrorAlertWithEMessage({ data: { error: 'Not allowed [error-not-allowed]', errorType: 'error-not-allowed' } });
		expect(alertMessage()).toBe('translated:error-not-allowed');
	});

	it('keeps a REST error message that has no bracketed code', () => {
		showErrorAlertWithEMessage({ data: { error: 'User is banned' } });
		expect(alertMessage()).toBe('User is banned');
	});

	it('keeps a bracketed suffix that differs from the error code', () => {
		showErrorAlertWithEMessage({ data: { error: 'Failed [other-code]', errorType: 'error-user-not-found' } });
		expect(alertMessage()).toBe('Failed [other-code]');
	});

	it('translates a plain REST message that is itself a translation key', () => {
		showErrorAlertWithEMessage({ data: { error: 'Some_translated_key' } });
		expect(alertMessage()).toBe('translated:Some_translated_key');
	});

	it('shows the reason of a DDP error whose code has no translation', () => {
		showErrorAlertWithEMessage({
			error: 'error-invalid-user',
			reason: 'Invalid user',
			message: 'Invalid user [error-invalid-user]'
		});
		expect(alertMessage()).toBe('Invalid user');
	});

	it('shows the translation of a DDP error whose code is translated', () => {
		showErrorAlertWithEMessage({
			error: 'error-not-allowed',
			reason: 'Rejected by the server',
			message: 'Rejected by the server [error-not-allowed]'
		});
		expect(alertMessage()).toBe('translated:error-not-allowed');
	});

	it('shows the reason of a DDP error whose code is numeric', () => {
		showErrorAlertWithEMessage({ error: 404, reason: "Method 'x' not found", message: "Method 'x' not found [404]" });
		expect(alertMessage()).toBe("Method 'x' not found");
	});

	it('shows the message of a DDP error without a reason', () => {
		showErrorAlertWithEMessage({ error: 'error-invalid-room', message: 'Invalid room [error-invalid-room]' });
		expect(alertMessage()).toBe('Invalid room');
	});

	it('shows the rate limit message with the seconds to wait', () => {
		showErrorAlertWithEMessage({
			data: {
				error:
					'Error, too many requests. Please slow down. You must wait 12 seconds before trying this endpoint again. [error-too-many-requests]',
				errorType: 'error-too-many-requests'
			}
		});
		expect(alertMessage()).toBe('error-too-many-requests 12');
	});

	it('forwards the title', () => {
		showErrorAlertWithEMessage({ data: { error: 'User is banned' } }, 'Oops');
		expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe('Oops');
	});
});
