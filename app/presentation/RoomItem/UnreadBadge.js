import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const UnreadBadge = React.memo(({
	theme, unread, userMentions, type
}) => {
	if (!unread || unread <= 0) {
		return;
	}
	if (unread >= 1000) {
		unread = '999+';
	}
	const mentioned = userMentions > 0 && type !== 'd';

	return (
		<View
			style={[
				styles.unreadNumberContainer,
				{ backgroundColor: mentioned ? themes[theme].tintColor : themes[theme].borderColor }
			]}
		>
			<Text
				style={[
					styles.unreadText,
					{ color: mentioned ? themes[theme].buttonText : themes[theme].bodyText }
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
	type: PropTypes.string
};

export default UnreadBadge;
