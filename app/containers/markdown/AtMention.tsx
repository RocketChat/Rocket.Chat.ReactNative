import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { IUserMention } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';

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
			<Text style={[styles.plainText, styles.text]}>
				<View style={{ marginBottom: isIOS ? -2 : 0 }}>
					<Text
						style={[
							styles.plainText,
							styles.text,
							{
								fontSize: 16,
								...sharedStyles.textMedium,
								borderRadius: 4,
								overflow: 'hidden',
								marginBottom: isIOS ? 0 : -5,
								color: themes[theme].pureWhite,
								backgroundColor: themes[theme].mentionGroupColor,
								lineHeight: 23
							}
						]}
					>
						{` ${mention} `}
					</Text>
				</View>
			</Text>
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
			<Text style={[styles.plainText, styles.text]}>
				<View style={{ marginBottom: isIOS ? -2 : 0 }}>
					<Text
						style={[
							styles.plainText,
							styles.text,
							{
								fontSize: 16,
								...sharedStyles.textMedium,
								borderRadius: 4,
								overflow: 'hidden',
								marginBottom: isIOS ? 0 : -5,
								lineHeight: 23
							},
							mentionStyle
						]}
						onPress={handlePress}
					>
						{` ${m} `}
					</Text>
				</View>
			</Text>
		);
	}

	return <Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>{`@${mention}`}</Text>;
});

export default AtMention;
