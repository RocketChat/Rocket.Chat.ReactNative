import React from 'react';
import { Text } from 'react-native';
import { emojify } from 'react-emojione';
import PropTypes from 'prop-types';
import _ from 'lodash';

import I18n from '../../i18n';
import styles from './styles';

const formatMsg = ({
	lastMessage, type, showLastMessage, username
}) => {
	if (!showLastMessage) {
		return '';
	}
	if (!lastMessage) {
		return I18n.t('No_Message');
	}

	let prefix = '';
	const isLastMessageSentByMe = lastMessage.u.username === username;

	if (!lastMessage.msg && Object.keys(lastMessage.attachments).length) {
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
		msg = emojify(msg, { output: 'unicode' });
	}
	return msg;
};

const arePropsEqual = (oldProps, newProps) => _.isEqual(oldProps, newProps);

const LastMessage = React.memo(({
	lastMessage, type, showLastMessage, username, alert
}) => (
	<Text style={[styles.markdownText, alert && styles.markdownTextAlert]} numberOfLines={2}>
		{formatMsg({
			lastMessage, type, showLastMessage, username
		})}
	</Text>
), arePropsEqual);

LastMessage.propTypes = {
	lastMessage: PropTypes.object,
	type: PropTypes.string,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	alert: PropTypes.bool
};

export default LastMessage;
