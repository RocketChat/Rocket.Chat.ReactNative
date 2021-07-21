import React from 'react';
import { Text } from 'react-native';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

interface IMessageEmoji {
	content: any;
	baseUrl: string;
	standardEmojiStyle: object;
	customEmojiStyle: object;
	getCustomEmoji: Function;
}

const Emoji = React.memo(({ content, baseUrl, standardEmojiStyle, customEmojiStyle, getCustomEmoji }: IMessageEmoji) => {
	const parsedContent = content.replace(/^:|:$/g, '');
	const emoji = getCustomEmoji(parsedContent);
	if (emoji) {
		return <CustomEmoji key={content} baseUrl={baseUrl} style={customEmojiStyle} emoji={emoji} />;
	}
	return <Text style={standardEmojiStyle}>{ shortnameToUnicode(content) }</Text>;
}, () => true);

Emoji.displayName = 'MessageEmoji';

export default Emoji;
