import React, { useContext } from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../constants/colors';
import styles from './styles';
import { events, logEvent } from '../../utils/log';
import MarkdownContext from './new/MarkdownContext';

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
	const { preview } = useContext(MarkdownContext);
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

	const user = mentions?.find?.((m: { username: string }) => m && m.username === mention);

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
			<Text style={!preview ? [styles.mention, mentionStyle, ...style] : styles.text} onPress={handlePress}>
				{useRealName && user.name ? user.name : user.username}
			</Text>
		);
	}

	return (
		<Text style={!preview ? [styles.text, { color: themes[theme!].bodyText }, ...style] : styles.text}>{`@${mention}`}</Text>
	);
});

export default AtMention;
