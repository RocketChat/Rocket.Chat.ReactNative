import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	unreadNumberContainer: {
		minWidth: 21,
		height: 21,
		paddingVertical: 3,
		paddingHorizontal: 5,
		borderRadius: 10.5,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	unreadText: {
		overflow: 'hidden',
		fontSize: 13,
		...sharedStyles.textMedium,
		letterSpacing: 0.56,
		textAlign: 'center'
	}
});

const UnreadBadge = React.memo(({
	theme, unread, userMentions, groupMentions, style
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
				{ backgroundColor },
				style
			]}
		>
			<Text
				style={[
					styles.unreadText,
					{ color }
				]}
			>{unread}
			</Text>
		</View>
	);
});

UnreadBadge.propTypes = {
	theme: PropTypes.string,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	style: PropTypes.object
};

export default UnreadBadge;
