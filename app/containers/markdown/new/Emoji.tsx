import React from 'react';
import { Text } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';

interface IEmojiProps {
	value: EmojiProps['value'];
	isBigEmoji?: boolean;
	getCustomEmoji: Function;
	baseUrl: string;
}

const Emoji = ({ value, isBigEmoji, getCustomEmoji, baseUrl }: IEmojiProps): JSX.Element => {
	const { theme } = useTheme();
	const emojiUnicode = shortnameToUnicode(`:${value.value}:`);
	const emoji = getCustomEmoji && getCustomEmoji(value.value);

	if (emoji) {
		return <CustomEmoji baseUrl={baseUrl} style={[isBigEmoji ? styles.customEmojiBig : styles.customEmoji]} emoji={emoji} />;
	}
	return <Text style={[{ color: themes[theme!].bodyText }, isBigEmoji ? styles.textBig : styles.text]}>{emojiUnicode}</Text>;
};

export default Emoji;
