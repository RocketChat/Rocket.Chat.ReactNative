import { LISTENER } from '../../../containers/Toast';
import i18n from '../../../i18n';
import EventEmitter from './events';
import log from './log';

export const emitErrorCreateDirectMessage = (e: any): void => {
	if (e?.errorType === 'error-not-allowed') {
		if (e?.details?.method === 'createDirectMessage')
			EventEmitter.emit(LISTENER, {
				message: i18n.t('error-action-not-allowed', { action: i18n.t('Create_Direct_Messages') })
			});
	} else {
		log(e);
	}
};
