import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';

const MentionsCount = React.memo(({ unread, userMentions }) => {
	if (!unread || unread <= 0) {
		return null;
	}

	if (unread >= 1000) {
		unread = '999+';
	}

	if (userMentions > 0) {
		unread = `@ ${ unread }`;
	}

	return (
		<View style={styles.unreadNumberContainer}>
			<Text style={styles.unreadNumberText}>{ unread }</Text>
		</View>
	);
});
MentionsCount.propTypes = {
	unread: PropTypes.number,
	userMentions: PropTypes.number
};

export default MentionsCount;
