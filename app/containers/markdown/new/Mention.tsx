import React from 'react';
import { StyleProp, Text, TextStyle, ViewStyle } from 'react-native';
import { UserMention as UserMentionProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { events, logEvent } from '../../../utils/log';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

interface IUser {
	_id: string;
	username: string;
	name: string;
}

type UserMention = Pick<IUser, '_id' | 'username' | 'name'>;

interface IMentionProps {
	value: UserMentionProps['value'];
	mentions: UserMention[];
	navToRoomInfo: Function;
	style: StyleProp<ViewStyle>[];
}

const Mention: React.FC<IMentionProps> = ({ value: { value: mention }, mentions, navToRoomInfo, style }) => {
	const { theme } = useTheme();
	let mentionStyle: StyleProp<TextStyle>;
	const notMentionedStyle = [styles.text, { color: themes[theme].bodyText }, ...style];
	const mentioned = mentions.find(mentioned => mentioned.username === mention);

	if (mention === 'all' || mention === 'here') {
		mentionStyle = [
			{
				color: themes[theme].mentionGroupColor
			},
			...style
		];
	} else if (mentioned) {
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
			rid: mentioned && mentioned._id
		};
		navToRoomInfo(navParam);
	};

	return (
		<Text
			style={[styles.mention, (mention || mentioned) && mentionStyle, !(mention || mentioned) && notMentionedStyle, ...style]}
			onPress={handlePress}>
			{mentioned ? mentioned.name || mention : `@{${mention}}`}
		</Text>
	);
};

export default Mention;
