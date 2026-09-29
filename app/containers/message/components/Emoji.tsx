import { PlainText } from '~/containers/PlainText';

import useShortnameToUnicode from '~/lib/hooks/useShortnameToUnicode';
import { useCustomEmoji } from '~/lib/hooks/useCustomEmoji';
import CustomEmoji from '~/containers/EmojiPicker/CustomEmoji';
import { type IMessageEmoji } from '../interfaces';

const Emoji = ({ content, standardEmojiStyle, customEmojiStyle }: IMessageEmoji) => {
	const getCustomEmoji = useCustomEmoji();
	const parsedContent = content.replace(/^:|:$/g, '');
	const emoji = getCustomEmoji(parsedContent);
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	if (emoji) {
		return <CustomEmoji key={content} style={customEmojiStyle} emoji={emoji} />;
	}
	return <PlainText style={standardEmojiStyle}>{formatShortnameToUnicode(content)}</PlainText>;
};

export default Emoji;
