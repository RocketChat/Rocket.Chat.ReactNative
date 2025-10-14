import React, { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import useShortnameToUnicode from '../../../../lib/hooks/useShortnameToUnicode';
import { useTheme } from '../../../../theme';
import styles from '../../styles';
import MarkdownContext from '../../contexts/MarkdownContext';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../../selectors/login';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import EmojiRenderer from '../../../../components/Emoji/Emoji';

interface IEmojiProps {
	block: EmojiProps;
	isBigEmoji?: boolean;
	style?: object;
	index?: number;
	isAvatar?: boolean;
}

function getEmojiToken(block: EmojiProps, isAvatar: boolean) {
	if ('unicode' in block) {
		return block.unicode;
	}

	if (isAvatar) {
		return block.value?.value;
	}

	return block?.shortCode ? `:${block.shortCode}:` : `:${block.value?.value}:`;
}

const Emoji = ({ block, isBigEmoji, style = {}, index, isAvatar = false }: IEmojiProps) => {
	const { colors } = useTheme();
	const { getCustomEmoji } = useContext(MarkdownContext);
	const { fontScale } = useWindowDimensions();
	const { fontScaleLimited } = useResponsiveLayout();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const spaceLeft = index && index > 0 ? ' ' : '';
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji);

	if ('unicode' in block) {
		return (
			<EmojiRenderer
				emoji={block.unicode}
				size={isBigEmoji ? 30 * fontScale : 15 * fontScale}
				style={[{ color: colors.fontDefault }, style]}
			/>
		);
	}

	const emojiToken = getEmojiToken(block, isAvatar);
	const emojiUnicode = formatShortnameToUnicode(emojiToken);
	const emoji = getCustomEmoji?.(block.value?.value.replace(/\:/g, ''));
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

	const avatarStyle = {
		fontSize: 30 * fontScaleLimited,
		lineHeight: 30 * fontScaleLimited,
		textAlign: 'center',
		textAlignVertical: 'center'
	};

	if (emoji) {
		return <EmojiRenderer style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style]} emoji={emoji} />;
	}

	return (
		<EmojiRenderer
			emoji={`${spaceLeft}${displayAsciiEmoji ? block.value!.value : emojiUnicode}`}
			size={isBigEmoji ? 30 * fontScale : 15 * fontScale}
			style={[
				{ color: colors.fontDefault },
				isBigEmoji && emojiToken !== emojiUnicode ? styles.textBig : styles.text,
				style,
				isAvatar && avatarStyle
			]}
		/>
	);
};

export default Emoji;
