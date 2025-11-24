import React, { useContext } from 'react';
import { type Emoji as EmojiProps } from '@rocket.chat/message-parser';

import MarkdownContext from '../../contexts/MarkdownContext';
import SharedEmoji from '../../../Emoji/Emoji';

interface IEmojiProps {
	block: EmojiProps;
	isBigEmoji?: boolean;
	style?: object;
	index?: number;
	isAvatar?: boolean;
}

const getEmojiToken = (block: EmojiProps, isAvatar: boolean) => {
	if ('unicode' in block) {
		return block.unicode;
	}
	if (isAvatar) {
		return block.value?.value;
	}
	return block?.shortCode ? `:${block.shortCode}:` : `:${block.value?.value}:`;
};

const Emoji = ({ block, isBigEmoji, style, index, isAvatar }: IEmojiProps) => {
	const { getCustomEmoji } = useContext(MarkdownContext);
	const literal = getEmojiToken(block, !!isAvatar);

	return <SharedEmoji literal={literal} isBigEmoji={isBigEmoji} style={style} isAvatar={isAvatar} getCustomEmoji={getCustomEmoji} />;
};

export default Emoji;
