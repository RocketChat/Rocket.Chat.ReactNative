import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';
import { events, logEvent } from '../../lib/methods/helpers/log';
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
	const { theme } = useTheme();
	if (mention === 'all' || mention === 'here') {
		return (
			<View style={styles.mentionView}>
				<Text style={[styles.plainText, styles.text, { color: themes[theme].bodyText }]}>
					@
					<View>
						<Text
							style={[
								styles.mention,
								{
									color: themes[theme].pureWhite,
									backgroundColor: themes[theme].mentionGroupColor
								},
								...style
							]}
						>
							{` ${mention} `}
						</Text>
					</View>
				</Text>
			</View>
		);
	}

	let mentionStyle = {};
	if (mention === username) {
		mentionStyle = {
			color: themes[theme].pureWhite,
			backgroundColor: themes[theme].mentionMeColor
		};
	} else {
		mentionStyle = {
			color: themes[theme].mentionOthersColor,
			backgroundColor: themes[theme].mentionOthersBackground
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
		const m = useRealName && user.name ? user.name : user.username;
		return (
			<View style={styles.mentionView}>
				<Text style={[styles.plainText, styles.text, { color: themes[theme].bodyText }]}>
					@
					<View>
						<Text style={[styles.mention, mentionStyle, ...style]} onPress={handlePress}>
							{` ${m} `}
						</Text>
					</View>
				</Text>
			</View>
		);
	}

	return <Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
