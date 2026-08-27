import { Alert } from 'react-native';

import EventEmitter from '../../../lib/methods/helpers/events';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { logoutOtherLocations as logoutOtherLocationsService } from '../../../lib/services/restApi';
import { TwoFactorCancelledError } from '../../../lib/services/twoFactor/twoFactorCancelled';
import logoutOtherLocations from './logoutOtherLocations';

jest.mock('../../../i18n', () => ({
	t: (key: string) => key,
	isTranslated: () => true
}));

jest.mock('../../../lib/services/restApi', () => ({
	logoutOtherLocations: jest.fn()
}));

jest.mock('../../../lib/methods/helpers/log', () => ({
	events: { PL_OTHER_LOCATIONS: 'PL_OTHER_LOCATIONS', PL_OTHER_LOCATIONS_F: 'PL_OTHER_LOCATIONS_F' },
	logEvent: jest.fn()
}));

const confirm = () => {
	const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
	return buttons[1].onPress();
};

describe('logoutOtherLocations', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.spyOn(EventEmitter, 'emit').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('confirms success when the action completes', async () => {
		(logoutOtherLocationsService as jest.Mock).mockResolvedValue({ success: true });

		logoutOtherLocations();
		await confirm();

		expect(EventEmitter.emit).toHaveBeenCalledWith(expect.anything(), { message: 'Logged_out_of_other_clients_successfully' });
		expect(logEvent).not.toHaveBeenCalledWith(events.PL_OTHER_LOCATIONS_F);
	});

	it('skips success behavior and reports no failure after a cancellation', async () => {
		(logoutOtherLocationsService as jest.Mock).mockRejectedValue(new TwoFactorCancelledError());

		logoutOtherLocations();
		await confirm();

		expect(EventEmitter.emit).not.toHaveBeenCalled();
		expect(logEvent).not.toHaveBeenCalledWith(events.PL_OTHER_LOCATIONS_F);
	});

	it('still reports a genuine failure', async () => {
		(logoutOtherLocationsService as jest.Mock).mockRejectedValue(new Error('boom'));

		logoutOtherLocations();
		await confirm();

		expect(logEvent).toHaveBeenCalledWith(events.PL_OTHER_LOCATIONS_F);
		expect(EventEmitter.emit).toHaveBeenCalledWith(expect.anything(), { message: 'Logout_failed' });
	});
});
