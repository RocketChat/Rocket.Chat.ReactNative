import { memo } from 'react';
import { Text } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import { useCustomEmoji } from '../../lib/hooks/useCustomEmoji';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { type IMessageEmoji } from './interfaces';

const Emoji = memo(
	({ content, standardEmojiStyle, customEmojiStyle }: IMessageEmoji) => {
		'use memo';

		const getCustomEmoji = useCustomEmoji();
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
