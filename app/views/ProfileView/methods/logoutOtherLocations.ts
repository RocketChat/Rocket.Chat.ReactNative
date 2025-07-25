import I18n from '../../../i18n';
import { LISTENER } from '../../../containers/Toast';
import EventEmitter from '../../../lib/methods/helpers/events';
import { showConfirmationAlert } from '../../../lib/methods/helpers';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { Services } from '../../../lib/services';

const logoutOtherLocations = () => {
	logEvent(events.PL_OTHER_LOCATIONS);
	showConfirmationAlert({
		message: I18n.t('You_will_be_logged_out_from_other_locations'),
		confirmationText: I18n.t('Logout'),
		onPress: async () => {
			try {
				await Services.logoutOtherLocations();
				EventEmitter.emit(LISTENER, { message: I18n.t('Logged_out_of_other_clients_successfully') });
			} catch {
				logEvent(events.PL_OTHER_LOCATIONS_F);
				EventEmitter.emit(LISTENER, { message: I18n.t('Logout_failed') });
			}
		}
	});
};

export default logoutOtherLocations;
