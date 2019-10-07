import React from 'react';
import { shortnameToUnicode } from 'emoji-toolkit';
import PropTypes from 'prop-types';
import _ from 'lodash';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../../containers/markdown';

const formatMsg = ({
	lastMessage, type, showLastMessage, username
}) => {
	if (!showLastMessage) {
		return '';
	}
	if (!lastMessage || lastMessage.pinned) {
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

	if (isLastMessageSentByMe) {
		prefix = I18n.t('You_colon');
	}	else if (type !== 'd') {
		prefix = `${ lastMessage.u.username }: `;
	}

	let msg = `${ prefix }${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
	if (msg) {
		msg = shortnameToUnicode(msg);
	}
	return msg;
};

const arePropsEqual = (oldProps, newProps) => _.isEqual(oldProps, newProps);

const LastMessage = React.memo(({
	lastMessage, type, showLastMessage, username, alert
}) => (
	<Markdown
		msg={formatMsg({
			lastMessage, type, showLastMessage, username
		})}
		style={[styles.markdownText, alert && styles.markdownTextAlert]}
		customEmojis={false}
		numberOfLines={2}
		preview
	/>
), arePropsEqual);

LastMessage.propTypes = {
	lastMessage: PropTypes.object,
	type: PropTypes.string,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	alert: PropTypes.bool
};

export default LastMessage;
