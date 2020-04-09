import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const AtMention = React.memo(({
	mention, mentions, username, navToRoomInfo, style = [], useRealName, theme
}) => {
	let mentionStyle = { ...styles.mention, color: themes[theme].buttonText };
	if (mention === 'all' || mention === 'here') {
		mentionStyle = {
			...mentionStyle,
			...styles.mentionAll
		};
	} else if (mention === username) {
		mentionStyle = {
			...mentionStyle,
			backgroundColor: themes[theme].actionTintColor
		};
	} else {
		mentionStyle = {
			...mentionStyle,
			color: themes[theme].actionTintColor
		};
	}

	const user = mentions && mentions.length && mentions.find(m => m.username === mention);

	const handlePress = () => {
		const navParam = {
			t: 'd',
			rid: user && user._id
		};
		navToRoomInfo(navParam);
	};

	if (user) {
		return (
			<Text
				style={[mentionStyle, ...style]}
				onPress={handlePress}
			>
				{useRealName && user.name ? user.name : user.username}
			</Text>
		);
	}

	return (
		<Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>
			{`@${ mention }`}
		</Text>
	);
});

AtMention.propTypes = {
	mention: PropTypes.string,
	username: PropTypes.string,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.array,
	useRealName: PropTypes.bool,
	theme: PropTypes.string,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default AtMention;
