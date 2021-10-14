import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';

interface IEmojiProps {
	value: EmojiProps['value'];
	style?: StyleProp<TextStyle>;
	isBigEmoji?: boolean;
}

const Emoji = ({ value, style, isBigEmoji }: IEmojiProps): JSX.Element => {
	const { theme } = useTheme();
	const emojiUnicode = shortnameToUnicode(`:${value.value}:`);
	return (
		<Text style={[{ color: themes[theme].bodyText }, isBigEmoji ? styles.textBig : styles.text, style]}>{emojiUnicode}</Text>
	);
};

export default Emoji;
