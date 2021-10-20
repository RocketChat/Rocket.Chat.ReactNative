import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../constants/colors';
import styles from './styles';
import { events, logEvent } from '../../utils/log';

interface IAtMention {
	mention: string;
	username: string;
	navToRoomInfo: Function;
	style?: any;
	useRealName: boolean;
	mentions: any;
}

const AtMention = React.memo(({ mention, mentions, username, navToRoomInfo, style = [], useRealName }: IAtMention) => {
	const { theme } = useTheme();
	if (mention === 'all' || mention === 'here') {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: themes[theme!].mentionGroupColor
					},
					...style
				]}>
				{mention}
			</Text>
		);
	}

	let mentionStyle = {};
	if (mention === username) {
		mentionStyle = {
			color: themes[theme!].mentionMeColor
		};
	} else {
		mentionStyle = {
			color: themes[theme!].mentionOtherColor
		};
	}

	const user = mentions?.find?.((m: any) => m && m.username === mention);

	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: user && user._id
		};
		navToRoomInfo(navParam);
	};

	if (user) {
		return (
			<Text style={[styles.mention, mentionStyle, ...style]} onPress={handlePress}>
				{useRealName && user.name ? user.name : user.username}
			</Text>
		);
	}

	return <Text style={[styles.text, { color: themes[theme!].bodyText }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
