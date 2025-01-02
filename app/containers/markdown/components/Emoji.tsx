import React, { useContext } from 'react';
import { Text } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import shortnameToUnicode from '../../../lib/methods/helpers/shortnameToUnicode';
import { useTheme } from '../../../theme';
import styles from '../styles';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import MarkdownContext from './MarkdownContext';

interface IEmojiProps {
	block: EmojiProps;
	isBigEmoji?: boolean;
}

const Emoji = ({ block, isBigEmoji }: IEmojiProps) => {
	const { colors } = useTheme();
	const { getCustomEmoji } = useContext(MarkdownContext);

	if ('unicode' in block) {
		return <Text style={[{ color: colors.fontDefault }, isBigEmoji ? styles.textBig : styles.text]}>{block.unicode}</Text>;
	}
	const emojiToken = block?.shortCode ? `:${block.shortCode}:` : `:${block.value?.value}:`;
	const emojiUnicode = shortnameToUnicode(emojiToken);
	const emoji = getCustomEmoji?.(block.value?.value);

	if (emoji) {
		return <CustomEmoji style={[isBigEmoji ? styles.customEmojiBig : styles.customEmoji]} emoji={emoji} />;
	}
	return (
		<Text style={[{ color: colors.fontDefault }, isBigEmoji && emojiToken !== emojiUnicode ? styles.textBig : styles.text]}>
			{emojiUnicode}
		</Text>
	);
};

export default Emoji;
