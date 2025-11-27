import React from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';

import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants/colors';
import { USER_MENTIONS_PREFERENCES_KEY } from '../../../../lib/constants/keys';
import styles from '../../styles';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { type IUserMention } from '../../interfaces';
import { useUserPreferences } from '../../../../lib/methods/userPreferences';

interface IAtMention {
	mention: string;
	username?: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	useRealName?: boolean;
	mentions?: IUserMention[];
}

const AtMention = React.memo(({ mention, mentions, username, navToRoomInfo, style = [], useRealName }: IAtMention) => {
	'use memo';

	const { theme } = useTheme();
	const [mentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY);
	const preffix = mentionsWithAtSymbol ? '@' : '';
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
				{preffix}
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

	const atMentioned = mentions?.find?.((m: any) => m && (m.username === mention || m.name === mention));

	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: atMentioned && atMentioned._id,
			itsMe
		};
		if (navToRoomInfo) {
			navToRoomInfo(navParam);
		}
	};

	if (atMentioned) {
		let text;
		if (atMentioned.type === 'user') {
			text = useRealName && atMentioned.name ? atMentioned.name : atMentioned.username;
		} else {
			text = atMentioned.name;
		}

		return (
			// not enough information on mentions to navigate to team info, so we don't handle onPress
			<Text style={[styles.mention, mentionStyle, ...style]} onPress={atMentioned?.type === 'team' ? undefined : handlePress}>
				{preffix}
				{text}
			</Text>
		);
	}

	return <Text style={[styles.text, { color: themes[theme].fontDefault }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
