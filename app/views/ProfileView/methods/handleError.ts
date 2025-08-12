 from '../../../i18n';
import { showErrorAlert } from '../../../lib/methods/helpers';

const handleError = (e: any, action: string) => {
	if (e.data && e.data.error.includes('[error-too-many-requests]')) {
		return showErrorAlert(e.data.error);
	}
	if (I18n.isTranslated(e.error)) {
		return showErrorAlert(I18n.t(e.error));
	}
	let msg = I18n.t('There_was_an_error_while_action', { action: I18n.t(action) });
	let title = '';
	if (typeof e.reason === 'string') {
		title = msg;
		msg = e.reason;
	}
	showErrorAlert(msg, title);
};

export default handleError;
