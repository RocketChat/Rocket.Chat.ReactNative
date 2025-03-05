import React from 'react';
import { StyleProp } from 'react-native';
import { Image, ImageStyle } from 'expo-image';

import { useAppSelector } from '../../lib/hooks';
import { ICustomEmoji } from '../../definitions';

interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ImageStyle>;
}

const CustomEmoji = React.memo(
	({ emoji, style }: ICustomEmojiProps) => {
		const baseUrl = useAppSelector(state => state.server.server);
		return (
			<Image
				style={style}
				source={{
					uri: `${baseUrl}/emoji-custom/${encodeURIComponent(emoji.name)}.${emoji.extension}`
				}}
				contentFit='contain'
			/>
		);
	},
	() => true
);

export default CustomEmoji;
