import React from 'react';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';
import styles from './styles';

interface IHashtag {
	hashtag: string;
	navToRoomInfo: Function;
	style: [];
	theme: string;
	channels: {
		name: string;
		_id: number;
	}[];
}

const Hashtag = React.memo(({ hashtag, channels, navToRoomInfo, style = [], theme }: IHashtag) => {
	const handlePress = () => {
		const index = channels.findIndex(channel => channel.name === hashtag);
		const navParam = {
			t: 'c',
			rid: channels[index]._id
		};
		navToRoomInfo(navParam);
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: themes[theme].mentionOtherColor
					},
					...style
				]}
				onPress={handlePress}>
				{`#${hashtag}`}
			</Text>
		);
	}
	return <Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>{`#${hashtag}`}</Text>;
});

export default Hashtag;
