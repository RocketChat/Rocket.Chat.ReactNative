import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const UnreadBadge = React.memo(({
	theme, unread, userMentions, groupMentions
}) => {
	if (!unread || unread <= 0) {
		return;
	}
	if (unread >= 1000) {
		unread = '999+';
	}

	let backgroundColor = themes[theme].unreadBackground;
	const color = themes[theme].buttonText;
	if (userMentions > 0) {
		backgroundColor = themes[theme].mentionMeColor;
	} else if (groupMentions > 0) {
		backgroundColor = themes[theme].mentionGroupColor;
	}

	return (
		<View
			style={[
				styles.unreadNumberContainer,
				{ backgroundColor }
			]}
		>
			<Text
				style={[
					styles.unreadText,
					{ color }
				]}
			>{ unread }
			</Text>
		</View>
	);
});

UnreadBadge.propTypes = {
	theme: PropTypes.string,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number
};

export default UnreadBadge;
