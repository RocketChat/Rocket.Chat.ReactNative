import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import styles from './styles';

const UnreadBadge = React.memo(({ unread, userMentions, type }) => {
	if (!unread || unread <= 0) {
		return;
	}
	if (unread >= 1000) {
		unread = '999+';
	}
	const mentioned = userMentions > 0 && type !== 'd';

	return (
		<View style={[styles.unreadNumberContainer, mentioned && styles.unreadMentionedContainer]}>
			<Text style={[styles.unreadText, mentioned && styles.unreadMentionedText]}>{ unread }</Text>
		</View>
	);
});

UnreadBadge.propTypes = {
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	type: PropTypes.string
};

export default UnreadBadge;
