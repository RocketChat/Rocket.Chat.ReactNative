import { Alert } from 'react-native';

import { showErrorAlertWithEMessage } from '../info';

jest.mock('~/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string, options?: { seconds: string }) => (options ? `${key}:${options.seconds}` : key),
		isTranslated: () => false
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

	it('shows the REST error from e.data.error', () => {
		showErrorAlertWithEMessage({ data: { error: 'User is banned' }, reason: 'ignored', message: 'ignored' });
		expect(alertMessage()).toBe('User is banned');
	});

	it('shows the error key of a DDP error', () => {
		showErrorAlertWithEMessage({ error: 'error-not-allowed', reason: 'Not allowed', message: 'Not allowed [error-not-allowed]' });
		expect(alertMessage()).toBe('error-not-allowed');
	});

	it('shows the reason of a DDP error whose error code is numeric', () => {
		showErrorAlertWithEMessage({ error: 404, reason: "Method 'foo' not found", message: "Method 'foo' not found [404]" });
		expect(alertMessage()).toBe("Method 'foo' not found");
	});

	it('shows the localized wait time of a REST rate-limit error', () => {
		showErrorAlertWithEMessage({
			data: {
				error:
					'Error, too many requests. Please slow down. You must wait 5 seconds before trying this endpoint again. [error-too-many-requests]'
			}
		});
		expect(alertMessage()).toBe('error-too-many-requests:5');
	});

	it('shows the localized wait time of a DDP rate-limit error', () => {
		showErrorAlertWithEMessage({
			error: 'too-many-requests',
			reason: 'Error, too many requests. Please slow down. You must wait 5 seconds before trying again.',
			message: 'Error, too many requests. Please slow down. You must wait 5 seconds before trying again. [too-many-requests]'
		});
		expect(alertMessage()).toBe('error-too-many-requests:5');
	});

	it('shows the message of a plain Error', () => {
		showErrorAlertWithEMessage(new TypeError('Network request failed'));
		expect(alertMessage()).toBe('Network request failed');
	});
});
