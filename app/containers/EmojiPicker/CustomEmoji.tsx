import React from 'react';
import { StyleProp } from 'react-native';
import FastImage, { ImageStyle } from 'react-native-fast-image';

import { useAppSelector } from '../../lib/hooks';
import { ICustomEmoji } from '../../definitions';

interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ImageStyle>;
}

const CustomEmoji = React.memo(
	({ emoji, style }: ICustomEmojiProps) => {
		const baseUrl = useAppSelector(state => state.share.server.server || state.server.server);
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
