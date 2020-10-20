import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { getUnreadStyle } from './getUnreadStyle';

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

const UnreadBadge = ({
	theme, unread, userMentions, groupMentions, tunread, style
}) => {
	const { backgroundColor, color } = getUnreadStyle({
		theme, unread, userMentions, groupMentions, tunread
	});

	if (!backgroundColor) {
		return null;
	}

	let text = unread || tunread.length;
	if (text >= 1000) {
		text = '999+';
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
			>{text}
			</Text>
		</View>
	);
};

UnreadBadge.propTypes = {
	theme: PropTypes.string,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	tunread: PropTypes.array,
	style: PropTypes.object
};

export default UnreadBadge;
