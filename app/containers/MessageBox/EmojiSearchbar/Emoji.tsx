import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../../theme';
import { IEmoji } from '../../../definitions';
import shortnameToUnicode from '../../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';
import styles from '../styles';

const EMOJI_SIZE = 32;

export const Emoji = ({ emoji }: { emoji: IEmoji }): React.ReactElement => {
	const { colors } = useTheme();
	if (typeof emoji === 'string') {
		return (
			<Text style={[styles.searchedEmoji, { fontSize: EMOJI_SIZE, color: colors.backdropColor }]}>
				{shortnameToUnicode(`:${emoji}:`)}
			</Text>
		);
	}
	return <CustomEmoji style={[styles.emojiSearchCustomEmoji, { height: EMOJI_SIZE, width: EMOJI_SIZE }]} emoji={emoji} />;
};
