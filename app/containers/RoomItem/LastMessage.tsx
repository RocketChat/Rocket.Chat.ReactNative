import React from 'react';
import { dequal } from 'dequal';

import I18n from '../../i18n';
import styles from './styles';
import { MarkdownPreview } from '../markdown';
import { E2E_MESSAGE_TYPE, E2E_STATUS, themes } from '../../lib/constants';
import { ILastMessageProps } from './interfaces';

const formatMsg = ({ lastMessage, type, showLastMessage, username, useRealName }: Partial<ILastMessageProps>) => {
	if (!showLastMessage) {
		return '';
	}
	if (!lastMessage || !lastMessage.u || lastMessage.pinned) {
		return I18n.t('No_Message');
	}
	if (lastMessage.t === 'jitsi_call_started') {
		const { u } = lastMessage;
		return I18n.t('Started_call', { userBy: u.username });
	}

	let prefix = '';
	const isLastMessageSentByMe = lastMessage.u.username === username;

	if (!lastMessage.msg && lastMessage.attachments && Object.keys(lastMessage.attachments).length) {
		const user = isLastMessageSentByMe ? I18n.t('You') : lastMessage.u.username;
		return I18n.t('User_sent_an_attachment', { user });
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

	return `${prefix}${lastMessage.msg}`;
};

const arePropsEqual = (oldProps: any, newProps: any) => dequal(oldProps, newProps);

const LastMessage = React.memo(
	({ lastMessage, type, showLastMessage, username, alert, useRealName, theme }: ILastMessageProps) => (
		<MarkdownPreview
			msg={formatMsg({
				lastMessage,
				type,
				showLastMessage,
				username,
				useRealName
			})}
			style={[styles.markdownText, { color: alert ? themes[theme].bodyText : themes[theme].auxiliaryText }]}
			numberOfLines={2}
			testID='room-item-last-message'
		/>
	),
	arePropsEqual
);

export default LastMessage;
