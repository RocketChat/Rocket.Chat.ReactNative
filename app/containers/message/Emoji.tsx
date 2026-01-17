import React from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { type IMessageEmoji } from './interfaces';

const Emoji = React.memo(
	({ content, standardEmojiStyle, customEmojiStyle, getCustomEmoji }: IMessageEmoji) => {
		'use memo';

		const parsedContent = content.replace(/^:|:$/g, '');
		const emoji = getCustomEmoji(parsedContent);
		const { formatShortnameToUnicode } = useShortnameToUnicode();
		if (emoji) {
			return <CustomEmoji key={content} style={customEmojiStyle} emoji={emoji} />;
		}
		return <Text style={standardEmojiStyle}>{formatShortnameToUnicode(content)}</Text>;
	},
	() => true
);

Emoji.displayName = 'MessageEmoji';

export default Emoji;
