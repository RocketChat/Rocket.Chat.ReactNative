import React from 'react';
import { Text } from 'react-native';
import { emojify } from 'react-emojione';
import PropTypes from 'prop-types';

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
	const me = lastMessage.u.username === username;

	if (!lastMessage.msg && Object.keys(lastMessage.attachments).length > 0) {
		if (me) {
			return I18n.t('User_sent_an_attachment', { user: I18n.t('You') });
		} else {
			return I18n.t('User_sent_an_attachment', { user: lastMessage.u.username });
		}
	}

	if (me) {
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

// FIXME: lastMessage is an object and makes React.memo to rerender all the time
const LastMessage = React.memo(({
	lastMessage, type, showLastMessage, username
}) => (
	<Text style={[styles.markdownText, alert && styles.markdownTextAlert]} numberOfLines={2}>
		{formatMsg({
			lastMessage, type, showLastMessage, username
		})}
	</Text>
));

LastMessage.propTypes = {
	lastMessage: PropTypes.object,
	type: PropTypes.string,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string
};

export default LastMessage;
