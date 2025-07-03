import React, { createContext, ReactElement, useContext, useState } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS, SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageInnerContext } from '../context';

interface IEmojiKeyboardProvider {
	children: ReactElement | null;
}

interface IEmojiKeyboardContextProps {
	showEmojiPickerSharedValue: SharedValue<boolean>;
	showEmojiSearchbarSharedValue: SharedValue<boolean>;
}

const EmojiKeyboardContext = createContext<IEmojiKeyboardContextProps>({
	showEmojiPickerSharedValue: { value: false } as SharedValue<boolean>,
	showEmojiSearchbarSharedValue: { value: false } as SharedValue<boolean>
});

export const EmojiKeyboardProvider = ({ children }: IEmojiKeyboardProvider) => {
	const showEmojiPickerSharedValue = useSharedValue(false);
	const showEmojiSearchbarSharedValue = useSharedValue(false);

	return (
		<EmojiKeyboardContext.Provider value={{ showEmojiPickerSharedValue, showEmojiSearchbarSharedValue }}>
			{children}
		</EmojiKeyboardContext.Provider>
	);
};

const IPAD_TOOLTIP_HEIGHT_OR_HW_KEYBOARD = 70;
const EMOJI_KEYBOARD_FIXED_HEIGHT = 250;

const useKeyboardAnimation = () => {
	const height = useSharedValue(0);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				if (e.duration === 0) {
					return;
				}
				height.value = e.height;
			},
			onInteractive: e => {
				'worklet';

				height.value = e.height;
			}
		},
		[]
	);

	return { height };
};

export const useEmojiKeyboard = () => {
	const { showEmojiPickerSharedValue, showEmojiSearchbarSharedValue } = useContext(EmojiKeyboardContext);
	const { focus } = useContext(MessageInnerContext);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showEmojiSearchbar, setShowEmojiSearchbar] = useState(false);

	const { bottom } = useSafeAreaInsets();
	const { height } = useKeyboardAnimation();
	const keyboardHeight = useSharedValue(bottom);
	const previousHeight = useSharedValue(bottom);

	const updateHeight = (force: boolean = false) => {
		'worklet';

		if (
			!force &&
			(showEmojiPickerSharedValue.value === true || showEmojiSearchbarSharedValue.value === true) &&
			previousHeight.value !== EMOJI_KEYBOARD_FIXED_HEIGHT
		) {
			return;
		}
		const notch = height.value > 0 ? 0 : bottom;
		keyboardHeight.value = height.value + notch;
		previousHeight.value = keyboardHeight.value;
	};

	const openEmojiKeyboard = () => {
		showEmojiPickerSharedValue.value = true;
	};

	const closeEmojiKeyboard = () => {
		showEmojiPickerSharedValue.value = false;
	};

	const openEmojiSearchbar = () => {
		showEmojiSearchbarSharedValue.value = true;
	};

	const closeEmojiSearchbar = () => {
		showEmojiSearchbarSharedValue.value = false;
		focus && focus();
	};

	const resetKeyboard = () => {
		updateHeight(true);
		closeEmojiKeyboard();
		closeEmojiSearchbar();
	};

	useAnimatedReaction(
		() => height.value,
		(currentValue, previousValue) => {
			if (previousValue === null) {
				return;
			}
			if (currentValue !== previousValue) {
				updateHeight();
			}
		},
		[height]
	);

	const openEmojiPicker = () => {
		'worklet';

		if (height.value < IPAD_TOOLTIP_HEIGHT_OR_HW_KEYBOARD) {
			keyboardHeight.value = EMOJI_KEYBOARD_FIXED_HEIGHT;
			previousHeight.value = keyboardHeight.value;
		}
	};

	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null || currentValue === previousValue) {
				return;
			}
			if (currentValue === true) {
				openEmojiPicker();
			} else if (previousHeight.value === EMOJI_KEYBOARD_FIXED_HEIGHT) {
				updateHeight();
			}
			runOnJS(setShowEmojiKeyboard)(currentValue);
		},
		[showEmojiPickerSharedValue]
	);

	useAnimatedReaction(
		() => showEmojiSearchbarSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null || currentValue === previousValue) {
				return;
			}
			if (currentValue === true && previousHeight.value === EMOJI_KEYBOARD_FIXED_HEIGHT) {
				updateHeight();
			} else if (currentValue === false && showEmojiPickerSharedValue.value === true) {
				openEmojiPicker();
			}
			runOnJS(setShowEmojiSearchbar)(currentValue);
		},
		[showEmojiSearchbarSharedValue]
	);

	return {
		// State values
		showEmojiPickerSharedValue,
		showEmojiKeyboard,
		showEmojiSearchbarSharedValue,
		showEmojiSearchbar,
		keyboardHeight,
		// Functions
		openEmojiKeyboard,
		closeEmojiKeyboard,
		openEmojiSearchbar,
		closeEmojiSearchbar,
		resetKeyboard
	};
};
