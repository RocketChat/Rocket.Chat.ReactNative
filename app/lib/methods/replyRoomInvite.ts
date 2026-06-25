import i18n from '../../i18n';
import { sendInvitationReply } from '../services/restApi';
import { showErrorAlert } from './helpers';
import log from './helpers/log';

export const replyRoomInvite = async (rid: string, action: 'accept' | 'reject') => {
	try {
		await sendInvitationReply(rid, action);
	} catch (e) {
		showErrorAlert(i18n.t('error-invitation-reply-action'));
		log(e);
	}
};
