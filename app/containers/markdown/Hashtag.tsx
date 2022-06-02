import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import { IUserChannel } from './interfaces';
import styles from './styles';

interface IHashtag {
	hashtag: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	channels?: IUserChannel[];
}

const Hashtag = React.memo(({ hashtag, channels, navToRoomInfo, style = [] }: IHashtag) => {
	const { colors } = useTheme();

	const handlePress = () => {
		const index = channels?.findIndex(channel => channel.name === hashtag);
		if (typeof index !== 'undefined' && navToRoomInfo) {
			const navParam = {
				t: 'c',
				rid: channels?.[index]._id
			};
			navToRoomInfo(navParam);
		}
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: colors.mentionOtherColor
					},
					...style
				]}
				onPress={handlePress}>
				{`#${hashtag}`}
			</Text>
		);
	}
	return <Text style={[styles.text, { color: colors.bodyText }, ...style]}>{`#${hashtag}`}</Text>;
});

export default Hashtag;
