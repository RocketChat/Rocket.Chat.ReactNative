import React from 'react';
import { Text } from 'react-native';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { IMessageEmoji } from './interfaces';

const Emoji = React.memo(
	({ content, standardEmojiStyle, customEmojiStyle, getCustomEmoji }: IMessageEmoji) => {
		const parsedContent = content.replace(/^:|:$/g, '');
		const emoji = getCustomEmoji(parsedContent);
		if (emoji) {
			return <CustomEmoji key={content} style={customEmojiStyle} emoji={emoji} />;
		}
		return <Text style={standardEmojiStyle}>{shortnameToUnicode(content)}</Text>;
	},
	() => true
);

Emoji.displayName = 'MessageEmoji';

export default Emoji;
