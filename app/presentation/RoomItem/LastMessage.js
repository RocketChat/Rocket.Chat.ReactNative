import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';

import styles from './styles';
import I18n from '../../i18n';

const LastMessage = ({ showLastMessage, lastMessage }) => {
	let msg = '';
	if (showLastMessage) {
		if (!lastMessage) {
			msg = I18n.t('No_Message');
		}

		// let prefix = '';
		// const me = lastMessage.u.username === user.username;

		// if (!lastMessage.msg && Object.keys(lastMessage.attachments).length > 0) {
		// 	if (me) {
		// 		return I18n.t('User_sent_an_attachment', { user: I18n.t('You') });
		// 	} else {
		// 		return I18n.t('User_sent_an_attachment', { user: lastMessage.u.username });
		// 	}
		// }

		// if (me) {
		// 	prefix = I18n.t('You_colon');
		// }	else if (type !== 'd') {
		// 	prefix = `${ lastMessage.u.username }: `;
		// }

		// let msg = `${ prefix }${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
		// msg = emojify(msg, { output: 'unicode' });
	}

	return <Text style={styles.markdownText} numberOfLines={2}>{msg}</Text>;
};
LastMessage.propTypes = {
	showLastMessage: PropTypes.bool,
	lastMessage: PropTypes.object
};

export default LastMessage;
