import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import FastImage from 'react-native-blasted-image';

import { useAppSelector } from '../../lib/hooks';
import type { ICustomEmoji } from '../../definitions';

interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ViewStyle>;
}

const CustomEmoji = React.memo(
	function CustomEmoji({ emoji, style }: ICustomEmojiProps) {
		const baseUrl = useAppSelector(state => state.server.server);
		return (
			<FastImage
				style={style}
				source={{
					uri: `${baseUrl}/emoji-custom/${encodeURIComponent(emoji.name)}.${emoji.extension}`
				}}
				resizeMode={'contain'}
			/>
		);
	},
	() => true
);

export default CustomEmoji;
