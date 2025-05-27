import React, { createContext, ReactElement, useContext } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IEmojiKeyboardProvider {
	children: ReactElement | null;
}

interface IEmojiKeyboardContextProps {
	showEmojiPickerSharedValue: SharedValue<boolean>;
}

const EmojiKeyboardContext = createContext<IEmojiKeyboardContextProps>({} as IEmojiKeyboardContextProps);

export const EmojiKeyboardProvider = ({ children }: IEmojiKeyboardProvider) => {
	const showEmojiPickerSharedValue = useSharedValue(false);

	return <EmojiKeyboardContext.Provider value={{ showEmojiPickerSharedValue }}>{children}</EmojiKeyboardContext.Provider>;
};

export const useEmojiKeyboard = () => {
	const context = useContext(EmojiKeyboardContext);

	return context;
};

const IPAD_TOOLTIP_HEIGHT = 70;
const EMOJI_KEYBOARD_FIXED_HEIGHT = 300;

export const useEmojiKeyboardHeight = () => {
	const { showEmojiPickerSharedValue } = useContext(EmojiKeyboardContext);
	const { bottom } = useSafeAreaInsets();
	const keyboardHeight = useSharedValue(bottom);

	const updateKeyboardHeight = (height: number) => {
		'worklet';

		// don't add the notch height if the keyboard is already open
		const notch = height > 0 ? 0 : bottom;
		keyboardHeight.value = height + notch;
	};

	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		() => {
			// iPad shows a tooltip sometimes and the height seems to be less than 70.
			// This logic also fixes emoji keyboard height when using a hardware keyboard.
			if (showEmojiPickerSharedValue.value === true && keyboardHeight.value < IPAD_TOOLTIP_HEIGHT) {
				keyboardHeight.value = EMOJI_KEYBOARD_FIXED_HEIGHT;
			} else if (showEmojiPickerSharedValue.value === false) {
				updateKeyboardHeight(0);
			}
		},
		[showEmojiPickerSharedValue]
	);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				// we want to preserve the previously open keyboard height when emoji keyboard is opened,
				// so we just ignore the keyboard event when emoji keyboard is closed
				if (showEmojiPickerSharedValue.value === false) {
					updateKeyboardHeight(e.height);
				}
			}
		},
		[]
	);

	return { keyboardHeight };
};
