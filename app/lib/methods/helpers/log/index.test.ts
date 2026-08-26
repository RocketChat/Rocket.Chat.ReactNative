import bugsnag from '@bugsnag/react-native';

import log from './index';
import { TwoFactorCancelledError } from '../../../services/twoFactor/twoFactorCancelled';

describe('log', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(bugsnag, 'notify').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not report a two-factor cancellation to crash logging or the console', () => {
		log(new TwoFactorCancelledError());
		expect(bugsnag.notify).not.toHaveBeenCalled();
		expect(console.error).not.toHaveBeenCalled();
	});

	it('still reports a genuine failure', () => {
		log(new Error('boom'));
		expect(console.error).toHaveBeenCalled();
	});
});
