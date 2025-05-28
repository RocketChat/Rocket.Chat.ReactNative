import React, { createContext, ReactElement, useContext, useState } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS, SharedValue, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
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
	const { showEmojiPickerSharedValue } = useContext(EmojiKeyboardContext);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);

	const openEmojiKeyboard = () => {
		showEmojiPickerSharedValue.value = true;
	};

	const closeEmojiKeyboard = () => {
		showEmojiPickerSharedValue.value = false;
	};

	// Sync shared value with React state for proper re-renders
	// This maintains single source of truth while enabling React updates
	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		currentValue => {
			runOnJS(setShowEmojiKeyboard)(currentValue);
		},
		[showEmojiPickerSharedValue]
	);

	return {
		showEmojiPickerSharedValue,
		showEmojiKeyboard,
		openEmojiKeyboard,
		closeEmojiKeyboard
	};
};

const IPAD_TOOLTIP_HEIGHT = 70;
const EMOJI_KEYBOARD_FIXED_HEIGHT = 300;

export const useEmojiKeyboardHeight = () => {
	const { showEmojiPickerSharedValue } = useContext(EmojiKeyboardContext);
	const { bottom } = useSafeAreaInsets();
	const keyboardHeight = useSharedValue(bottom);
	// const { openEmojiKeyboard, closeEmojiKeyboard } = useMessageComposerApi();

	const updateKeyboardHeight = (height: number) => {
		'worklet';

		// Don't add the notch height if the keyboard is already open
		const notch = height > 0 ? 0 : bottom;
		keyboardHeight.value = withTiming(height + notch, { duration: 250 });
	};

	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		(currentValue, previousValue) => {
			// Only react to actual changes
			if (currentValue === previousValue) {
				return;
			}

			if (currentValue === true) {
				// iPad shows a tooltip sometimes and the height seems to be less than 70.
				// This logic also fixes emoji keyboard height when using a hardware keyboard.
				if (keyboardHeight.value < IPAD_TOOLTIP_HEIGHT) {
					keyboardHeight.value = withTiming(EMOJI_KEYBOARD_FIXED_HEIGHT, { duration: 250 });
				}
			} else {
				// Close emoji keyboard
				updateKeyboardHeight(0);
			}
		},
		[showEmojiPickerSharedValue, keyboardHeight]
	);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				// We want to preserve the previously open keyboard height when emoji keyboard is opened,
				// so we just ignore the keyboard event when emoji keyboard is open
				if (showEmojiPickerSharedValue.value === false) {
					updateKeyboardHeight(e.height);
				}
			}
		},
		[showEmojiPickerSharedValue]
	);

	return { keyboardHeight };
};
