import React from 'react';
import FastImage from 'react-native-fast-image';

import { ICustomEmoji } from '../../definitions';

const CustomEmoji = React.memo(
	({ baseUrl, emoji, style, testID }: ICustomEmoji) => (
		<FastImage
			style={style}
			source={{
				uri: `${baseUrl}/emoji-custom/${encodeURIComponent(emoji.content || emoji.name)}.${emoji.extension}`,
				priority: FastImage.priority.high
			}}
			resizeMode={FastImage.resizeMode.contain}
			testID={testID}
		/>
	),
	(prevProps, nextProps) => {
		const prevEmoji = prevProps.emoji.content || prevProps.emoji.name;
		const nextEmoji = nextProps.emoji.content || nextProps.emoji.name;
		return prevEmoji === nextEmoji;
	}
);

export default CustomEmoji;
