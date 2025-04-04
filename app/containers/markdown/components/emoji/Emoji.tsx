import React, { useContext } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import shortnameToUnicode from '../../../../lib/methods/helpers/shortnameToUnicode';
import { useTheme } from '../../../../theme';
import styles from '../../styles';
import CustomEmoji from '../../../EmojiPicker/CustomEmoji';
import MarkdownContext from '../../contexts/MarkdownContext';

interface IEmojiProps {
	block: EmojiProps;
	isBigEmoji?: boolean;
	style?: object;
}

const Emoji = ({ block, isBigEmoji, style = {} }: IEmojiProps) => {
	const { colors } = useTheme();
	const { getCustomEmoji } = useContext(MarkdownContext);
	const { fontScale } = useWindowDimensions();

	if ('unicode' in block) {
		return <Text style={[{ color: colors.fontDefault }, isBigEmoji ? styles.textBig : styles.text]}>{block.unicode}</Text>;
	}
	const emojiToken = block?.shortCode ? `:${block.shortCode}:` : `:${block.value?.value}:`;
	const emojiUnicode = shortnameToUnicode(emojiToken);
	const emoji = getCustomEmoji?.(block.value?.value);
	const customEmojiSize = {
		width: 15 * fontScale,
		height: 15 * fontScale
	};

	const customEmojiBigSize = {
		width: 30 * fontScale,
		height: 30 * fontScale
	};
	if (emoji) {
		return <CustomEmoji style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style]} emoji={emoji} />;
	}
	return (
		<Text
			style={[{ color: colors.fontDefault }, isBigEmoji && emojiToken !== emojiUnicode ? styles.textBig : styles.text, style]}>
			{emojiUnicode}
		</Text>
	);
};

export default Emoji;
