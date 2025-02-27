import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants';
import styles from '../../styles';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { IUserMention } from '../../interfaces';

interface IAtMention {
	mention: string;
	username?: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	useRealName?: boolean;
	mentions?: IUserMention[];
}

const AtMention = React.memo(({ mention, mentions, username, navToRoomInfo, style = [], useRealName }: IAtMention) => {
	const { theme } = useTheme();
	if (mention === 'all' || mention === 'here') {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: themes[theme].statusFontService
					},
					...style
				]}>
				{mention}
			</Text>
		);
	}

	const itsMe = mention === username;
	let mentionStyle = {};
	if (itsMe) {
		mentionStyle = {
			color: themes[theme].statusFontDanger
		};
	} else {
		mentionStyle = {
			color: themes[theme].statusFontWarning
		};
	}

	const user = mentions?.find?.((m: any) => m && m.username === mention);

	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: user && user._id,
			itsMe
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

	return <Text style={[styles.text, { color: themes[theme].statusFontWarning }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
