import React from 'react';
import { Text } from 'react-native';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { themes } from '../../constants/colors';

import styles from './styles';

interface IEmoji {
	literal: string;
	isMessageContainsOnlyEmoji: boolean;
	getCustomEmoji?({}: any): string;
	baseUrl: string;
	customEmojis?: boolean;
	style: object;
	theme?: string;
}

const Emoji = React.memo(({
	literal, isMessageContainsOnlyEmoji, getCustomEmoji, baseUrl, customEmojis = true, style = {}, theme
}: IEmoji) => {
	const emojiUnicode = shortnameToUnicode(literal);
	const emoji: any = getCustomEmoji && getCustomEmoji(literal.replace(/:/g, ''));
	if (emoji && customEmojis) {
		return (
			<CustomEmoji
				baseUrl={baseUrl}
				style={[
					isMessageContainsOnlyEmoji ? styles.customEmojiBig : styles.customEmoji,
					style
				]}
				emoji={emoji}
			/>
		);
	}
	return (
		<Text
			style={[
				{ color: themes[theme!].bodyText },
				isMessageContainsOnlyEmoji ? styles.textBig : styles.text,
				style
			]}
		>
			{emojiUnicode}
		</Text>
	);
});

export default Emoji;
