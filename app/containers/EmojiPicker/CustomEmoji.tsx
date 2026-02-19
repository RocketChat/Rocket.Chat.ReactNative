import { Image } from 'expo-image';
import { memo } from 'react';

import { useAppSelector } from '../../lib/hooks/useAppSelector';
import type { ICustomEmojiProps } from './interfaces';

const CustomEmoji = memo(
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
