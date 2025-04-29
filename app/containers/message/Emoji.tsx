import React from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { IMessageEmoji } from './interfaces';

const Emoji = React.memo(
	({ content, standardEmojiStyle, customEmojiStyle, getCustomEmoji }: IMessageEmoji) => {
		const parsedContent = content.replace(/^:|:$/g, '');
		const emoji = getCustomEmoji(parsedContent);
		const shortnameToUnicode = useShortnameToUnicode(content);
		if (emoji) {
			return <CustomEmoji key={content} style={customEmojiStyle} emoji={emoji} />;
		}
		return <Text style={standardEmojiStyle}>{shortnameToUnicode}</Text>;
	},
	() => true
);

Emoji.displayName = 'MessageEmoji';

export default Emoji;
