import React, { useContext } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { Emoji as EmojiProps } from '@rocket.chat/message-parser';

import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import MessageContext from '../../message/Context';

interface IEmojiProps {
	value: EmojiProps['value'];
	style?: StyleProp<TextStyle>;
	isBigEmoji?: boolean;
	getCustomEmoji: Function;
}

const Emoji = ({ value, style, isBigEmoji, getCustomEmoji }: IEmojiProps): JSX.Element => {
	const { theme } = useTheme();
	const { baseUrl } = useContext(MessageContext);
	const emojiUnicode = shortnameToUnicode(`:${value.value}:`);
	const emoji = getCustomEmoji && getCustomEmoji(value.value);

	if (emoji) {
		return (
			<CustomEmoji baseUrl={baseUrl} style={[isBigEmoji ? styles.customEmojiBig : styles.customEmoji, style]} emoji={emoji} />
		);
	}
	return (
		<Text style={[{ color: themes[theme!].bodyText }, isBigEmoji ? styles.textBig : styles.text, style]}>{emojiUnicode}</Text>
	);
};

export default Emoji;
