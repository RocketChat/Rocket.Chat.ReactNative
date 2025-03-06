import React from 'react';
import { Pressable } from 'react-native';

import styles, { EMOJI_BUTTON_SIZE } from './styles';
import { IEmoji } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';
import { Emoji } from './Emoji';

export const PressableEmoji = ({ emoji, onPress }: { emoji: IEmoji; onPress: (emoji: IEmoji) => void }): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={typeof emoji === 'string' ? emoji : emoji.name}
			onPress={() => onPress(emoji)}
			testID={`emoji-${typeof emoji === 'string' ? emoji : emoji.name}`}
			android_ripple={{ color: colors.buttonBackgroundSecondaryPress, borderless: true, radius: EMOJI_BUTTON_SIZE / 2 }}
			style={({ pressed }: { pressed: boolean }) => [
				styles.emojiButton,
				{
					backgroundColor: isIOS && pressed ? colors.buttonBackgroundSecondaryPress : 'transparent'
				}
			]}>
			<Emoji emoji={emoji} />
		</Pressable>
	);
};
