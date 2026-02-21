import React from 'react';
import { Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import styles, { EMOJI_BUTTON_SIZE } from './styles';
import { type IEmoji } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';
import { Emoji } from './Emoji';

export const PressableEmoji = ({ emoji, onPress }: { emoji: IEmoji; onPress: (emoji: IEmoji) => void }): React.ReactElement => {
	const { colors } = useTheme();
	const accessibilityLabel = typeof emoji === 'string' ? emoji : emoji.name;

	const tap = Gesture.Tap().onStart(() => {
		runOnJS(onPress)(emoji);
	});

	return (
		<GestureDetector gesture={tap}>
			<Pressable
				accessible
				accessibilityLabel={accessibilityLabel}
				key={typeof emoji === 'string' ? emoji : emoji.name}
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
		</GestureDetector>
	);
};
