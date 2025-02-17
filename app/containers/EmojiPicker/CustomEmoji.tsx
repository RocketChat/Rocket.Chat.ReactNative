import React from 'react';
import type { StyleProp } from 'react-native';
import FastImage, { type ImageStyle } from '@d11/react-native-fast-image';

import { useAppSelector } from '../../lib/hooks';
import type { ICustomEmoji } from '../../definitions';

interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ImageStyle>;
}

const CustomEmoji = React.memo(
	function CustomEmoji({ emoji, style }: ICustomEmojiProps) {
		const baseUrl = useAppSelector(state => state.server.server);
		return (
			<FastImage
				style={style}
				source={{
					uri: `${baseUrl}/emoji-custom/${encodeURIComponent(emoji.name)}.${emoji.extension}`,
					priority: FastImage.priority.high
				}}
				resizeMode={FastImage.resizeMode.contain}
			/>
		);
	},
	() => true
);

export default CustomEmoji;
