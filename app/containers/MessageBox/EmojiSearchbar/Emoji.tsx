import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { useTheme } from '../../../theme';
import { IEmoji } from '../../../definitions';
import shortnameToUnicode from '../../../lib/methods/helpers/shortnameToUnicode';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';

const EMOJI_SIZE = 32;

const styles = StyleSheet.create({
	searchedEmoji: {
		backgroundColor: 'transparent',
		fontSize: EMOJI_SIZE
	},
	emojiSearchCustomEmoji: {
		margin: 4,
		height: EMOJI_SIZE,
		width: EMOJI_SIZE
	}
});

export const Emoji = ({ emoji }: { emoji: IEmoji }): React.ReactElement => {
	const { colors } = useTheme();
	if (typeof emoji === 'string') {
		return <Text style={[styles.searchedEmoji, { color: colors.backdropColor }]}>{shortnameToUnicode(`:${emoji}:`)}</Text>;
	}
	return <CustomEmoji style={styles.emojiSearchCustomEmoji} emoji={emoji} />;
};
