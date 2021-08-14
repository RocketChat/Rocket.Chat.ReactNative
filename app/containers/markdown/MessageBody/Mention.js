import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import { events, logEvent } from '../../../utils/log';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

const Mention = ({
	value: mention, mentions, navToRoomInfo, style
}) => {
	const { theme } = useTheme();
	let mentionStyle = [];
	const notMentionedStyle = [styles.text, { color: themes[theme].bodyText }, ...style];
	const mentionedUser = mentions.find(mentioned => mentioned.username === mention.value);

	if (mention === 'all' || mention === 'here') {
		mentionStyle = [
			{
				color: themes[theme].mentionGroupColor
			},
			...style
		];
	}

	if (mention === mentionedUser) {
		mentionStyle = {
			color: themes[theme].mentionMeColor
		};
	} else {
		mentionStyle = {
			color: themes[theme].mentionOtherColor
		};
	}

	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: mentionedUser && mentionedUser._id
		};
		navToRoomInfo(navParam);
	};

	return (
		<Text
			style={[styles.mention, (mention || mentionedUser) && mentionStyle, !(mention || mentionedUser) && notMentionedStyle, ...style]}
			onPress={handlePress}
		>
			{mentionedUser ? mentionedUser.name || mention.value : `@{${ mention }}` }
		</Text>
	);
};

Mention.propTypes = {
	value: PropTypes.string,
	mentions: PropTypes.array,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Mention;
