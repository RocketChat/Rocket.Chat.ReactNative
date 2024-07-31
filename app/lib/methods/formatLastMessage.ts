import { ILastMessageProps } from '../../containers/RoomItem/interfaces';
import I18n from '../../i18n';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants';

export const formatLastMessage = ({ lastMessage, type, showLastMessage, username, useRealName }: Partial<ILastMessageProps>) => {
	if (!showLastMessage) {
		return '';
	}
	if (!lastMessage || !lastMessage.u) {
		return I18n.t('No_Message');
	}
	if (lastMessage.t === 'jitsi_call_started') {
		const { u } = lastMessage;
		return I18n.t('Started_call', { userBy: u.username });
	}

	let prefix = '';
	const isLastMessageSentByMe = lastMessage.u.username === username;

	if (!lastMessage.msg && lastMessage.attachments && Object.keys(lastMessage.attachments).length) {
		const userAttachment = () => {
			if (isLastMessageSentByMe) {
				return I18n.t('You');
			}
			if (useRealName && lastMessage.u.name) {
				return lastMessage.u.name;
			}
			return lastMessage.u.username;
		};
		return I18n.t('User_sent_an_attachment', { user: userAttachment() });
	}

	// Encrypted message pending decrypt
	if (lastMessage.t === E2E_MESSAGE_TYPE && lastMessage.e2e !== E2E_STATUS.DONE) {
		lastMessage.msg = I18n.t('Encrypted_message');
	}

	if (isLastMessageSentByMe) {
		prefix = I18n.t('You_colon');
	} else if (type !== 'd') {
		const {
			u: { name }
		} = lastMessage;
		prefix = `${useRealName ? name : lastMessage.u.username}: `;
	}

	if (lastMessage.t === 'videoconf') {
		prefix = '';
		lastMessage.msg = I18n.t('Call_started');
	}

	return `${prefix}${lastMessage.msg}`;
};
