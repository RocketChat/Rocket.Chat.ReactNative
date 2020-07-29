import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const AtMention = React.memo(({
	mention, mentions, username, navToRoomInfo, style = [], useRealName, theme
}) => {
	if (mention === 'all' || mention === 'here') {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: themes[theme].mentionGroupColor,
						backgroundColor: themes[theme].mentionGroupBackground
					},
					...style
				]}
			>{mention}
			</Text>
		);
	}

	let mentionStyle = {};
	if (mention === username) {
		mentionStyle = {
			color: themes[theme].mentionMeColor,
			backgroundColor: themes[theme].mentionMeBackground
		};
	} else {
		mentionStyle = {
			color: themes[theme].mentionOtherColor,
			backgroundColor: themes[theme].mentionOtherBackground
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
				style={[styles.mention, mentionStyle, ...style]}
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
