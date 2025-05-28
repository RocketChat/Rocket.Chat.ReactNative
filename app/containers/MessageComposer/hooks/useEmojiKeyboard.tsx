import React, { createContext, ReactElement, useContext } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMessageComposerApi, useShowEmojiKeyboard } from '../context';

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
	// const showEmojiKeyboard = useShowEmojiKeyboard();
	const { openEmojiKeyboard, closeEmojiKeyboard } = useMessageComposerApi();

	const updateKeyboardHeight = (height: number) => {
		'worklet';

		// don't add the notch height if the keyboard is already open
		console.log('updateKeyboardHeight height BEFORE', keyboardHeight.value);
		const notch = height > 0 ? 0 : bottom;
		// if (keyboardHeight.value < IPAD_TOOLTIP_HEIGHT && height + notch < IPAD_TOOLTIP_HEIGHT) {
		// 	console.log('updateKeyboardHeight EARLY RETURN');
		// 	return;
		// }
		keyboardHeight.value = height + notch;
		console.log('updateKeyboardHeight height AFTER', keyboardHeight.value);
	};

	useDerivedValue(() => {
		console.log(
			'useDerivedValue keyboardHeight showEmojiPickerSharedValue',
			keyboardHeight.value,
			showEmojiPickerSharedValue.value
		);
	}, [keyboardHeight, showEmojiPickerSharedValue]);

	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		(currentValue, previousValue) => {
			console.log('useEmojiKeyboard useAnimatedReaction currentValue previousValue', currentValue, previousValue);
			console.log(
				'useEmojiKeyboard useAnimatedReaction BEFORE showEmojiPickerSharedValue keyboardHeight',
				showEmojiPickerSharedValue.value,
				keyboardHeight.value
			);

			// if (currentValue === previousValue) {
			// 	console.log('useEmojiKeyboard useAnimatedReaction EARLY RETURN');
			// 	return;
			// }

			// iPad shows a tooltip sometimes and the height seems to be less than 70.
			// This logic also fixes emoji keyboard height when using a hardware keyboard.
			if (showEmojiPickerSharedValue.value === true && keyboardHeight.value < IPAD_TOOLTIP_HEIGHT) {
				console.log('useEmojiKeyboard useAnimatedReaction 1');
				keyboardHeight.value = EMOJI_KEYBOARD_FIXED_HEIGHT;
			}
			// else if (showEmojiPickerSharedValue.value === false) {
			// 	console.log('useEmojiKeyboard useAnimatedReaction 2');
			// 	updateKeyboardHeight(0);
			// }

			if (showEmojiPickerSharedValue.value === true) {
				console.log('useEmojiKeyboard useAnimatedReaction 3');
				runOnJS(openEmojiKeyboard)();
			} else if (showEmojiPickerSharedValue.value === false) {
				console.log('useEmojiKeyboard useAnimatedReaction 4');
				if (keyboardHeight.value > 0) {
					updateKeyboardHeight(0);
					runOnJS(closeEmojiKeyboard)();
				}
			}
			console.log(
				'useEmojiKeyboard useAnimatedReaction AFTER showEmojiPickerSharedValue showEmojiKeyboard keyboardHeight',
				showEmojiPickerSharedValue.value,
				keyboardHeight.value
			);
		},
		[showEmojiPickerSharedValue, keyboardHeight]
	);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				console.log('useKeyboardHandler onStart keyboardHeight e', keyboardHeight.value, e.height);

				// if (keyboardHeight.value < IPAD_TOOLTIP_HEIGHT && e.height < IPAD_TOOLTIP_HEIGHT) {
				// 	console.log('useKeyboardHandler early return');
				// 	return;
				// }

				// we want to preserve the previously open keyboard height when emoji keyboard is opened,
				// so we just ignore the keyboard event when emoji keyboard is closed
				if (showEmojiPickerSharedValue.value === false) {
					updateKeyboardHeight(e.height);
				}
			}
		},
		[showEmojiPickerSharedValue]
	);

	return { keyboardHeight };
};
