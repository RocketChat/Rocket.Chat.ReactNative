import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const AtMention = React.memo(({
	mention, mentions, username, navToRoomInfo, preview, style = [], theme
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

	const handlePress = () => {
		const index = mentions.findIndex(m => m.username === mention);
		const navParam = {
			t: 'd',
			rid: mentions[index]._id
		};
		navToRoomInfo(navParam);
	};

	if (mentions && mentions.length && mentions.findIndex(m => m.username === mention) !== -1) {
		return (
			<Text
				style={[preview ? { ...styles.text, color: themes[theme].bodyText } : mentionStyle, ...style]}
				onPress={preview ? undefined : handlePress}
			>
				{mention}
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
	preview: PropTypes.bool,
	theme: PropTypes.string,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default AtMention;
