import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import styles from './styles';
import { events, logEvent } from '../../utils/log';
import { IUserMention } from './interfaces';

interface IAtMention {
	mention: string;
	username?: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	useRealName?: boolean;
	mentions?: IUserMention[];
}

const AtMention = React.memo(({ mention, mentions, username, navToRoomInfo, style = [], useRealName }: IAtMention) => {
	const { colors } = useTheme();
	if (mention === 'all' || mention === 'here') {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: colors.mentionGroupColor
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
			color: colors.mentionMeColor
		};
	} else {
		mentionStyle = {
			color: colors.mentionOtherColor
		};
	}

	const user = mentions?.find?.((m: any) => m && m.username === mention);

	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: user && user._id
		};
		if (navToRoomInfo) {
			navToRoomInfo(navParam);
		}
	};

	if (user) {
		return (
			<Text style={[styles.mention, mentionStyle, ...style]} onPress={handlePress}>
				{useRealName && user.name ? user.name : user.username}
			</Text>
		);
	}

	return <Text style={[styles.text, { color: colors.bodyText }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
