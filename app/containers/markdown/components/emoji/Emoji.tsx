import React, { useContext } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import Plain from '../Plain';
import useShortnameToUnicode from '../../../../lib/hooks/useShortnameToUnicode';
import { useTheme } from '../../../../theme';
import styles from '../../styles';
import CustomEmoji from '../../../EmojiPicker/CustomEmoji';
import MarkdownContext from '../../contexts/MarkdownContext';
import { useAppSelector } from '../../../../lib/hooks';
import { getUserSelector } from '../../../../selectors/login';

interface IEmojiProps {
	block: EmojiProps;
	isBigEmoji?: boolean;
	style?: object;
	index?: number;
}

const Emoji = ({ block, isBigEmoji, style = {}, index }: IEmojiProps) => {
	const { colors } = useTheme();
	const { getCustomEmoji } = useContext(MarkdownContext);
	const { fontScale } = useWindowDimensions();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const spaceLeft = index && index > 0 ? ' ' : '';
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji);
	if ('unicode' in block) {
		return <Text style={[{ color: colors.fontDefault }, isBigEmoji ? styles.textBig : styles.text]}>{block.unicode}</Text>;
	}

	const emojiToken = block?.shortCode ? `:${block.shortCode}:` : `:${block.value?.value}:`;
	const emojiUnicode = formatShortnameToUnicode(emojiToken);
	const emoji = getCustomEmoji?.(block.value?.value);
	const isAsciiEmoji = !!block?.shortCode && block.value?.value !== block?.shortCode;
	const displayAsciiEmoji = !convertAsciiEmoji && isAsciiEmoji && !!block.value;
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
			{spaceLeft}
			{displayAsciiEmoji ? <Plain value={block.value!.value} /> : emojiUnicode}
		</Text>
	);
};

export default Emoji;
