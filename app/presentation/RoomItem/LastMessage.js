import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../../containers/markdown';
import { themes } from '../../constants/colors';

const formatMsg = ({
	lastMessage, type, showLastMessage, username, useRealName
}) => {
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

	if (isLastMessageSentByMe) {
		prefix = I18n.t('You_colon');
	}	else if (type !== 'd') {
		const { u: { name } } = lastMessage;
		prefix = `${ useRealName ? name : lastMessage.u.username }: `;
	}

	return `${ prefix }${ lastMessage.msg }`;
};

const arePropsEqual = (oldProps, newProps) => _.isEqual(oldProps, newProps);

const LastMessage = React.memo(({
	lastMessage, type, showLastMessage, username, alert, useRealName, theme
}) => (
	<Markdown
		msg={formatMsg({
			lastMessage, type, showLastMessage, username, useRealName
		})}
		style={[styles.markdownText, { color: alert ? themes[theme].bodyText : themes[theme].auxiliaryText }]}
		customEmojis={false}
		useRealName={useRealName}
		numberOfLines={2}
		preview
		theme={theme}
	/>
), arePropsEqual);

LastMessage.propTypes = {
	theme: PropTypes.string,
	lastMessage: PropTypes.object,
	type: PropTypes.string,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	useRealName: PropTypes.bool,
	alert: PropTypes.bool
};

export default LastMessage;
