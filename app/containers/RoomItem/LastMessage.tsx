import { dequal } from 'dequal';
import React from 'react';
import { TextStyle } from 'react-native';

import I18n from '../../i18n';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/constants';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';
import { ILastMessageProps } from './interfaces';
import styles from './styles';

const formatMsg = ({ lastMessage, type, showLastMessage, username, useRealName }: Partial<ILastMessageProps>) => {
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

const arePropsEqual = (oldProps: any, newProps: any) => dequal(oldProps, newProps);

const LastMessage = React.memo(({ lastMessage, type, showLastMessage, username, alert, useRealName }: ILastMessageProps) => {
	const { colors } = useTheme();
	// Android has a bug with the text align on the markdown preview
	const alignSelf: TextStyle = isAndroid ? { alignSelf: 'stretch' } : {};
	return (
		<MarkdownPreview
			msg={formatMsg({
				lastMessage,
				type,
				showLastMessage,
				username,
				useRealName
			})}
			style={[styles.markdownText, { color: alert ? colors.fontDefault : colors.fontSecondaryInfo }, alignSelf]}
			numberOfLines={2}
		/>
	);
}, arePropsEqual);

export default LastMessage;
