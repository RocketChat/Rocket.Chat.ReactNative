import React, { createContext, ReactElement, useContext, useState } from 'react';
import { Platform } from 'react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

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
	'use memo';

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
	'use memo';

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
			},
			onEnd: e => {
				'worklet';

				height.value = Math.max(e.height, 0);
			}
		},
		[]
	);

	return { height };
};

export const useEmojiKeyboard = () => {
	'use memo';

	const { showEmojiPickerSharedValue, showEmojiSearchbarSharedValue } = useContext(EmojiKeyboardContext);
	const { focus } = useContext(MessageInnerContext);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showEmojiSearchbar, setShowEmojiSearchbar] = useState(false);

	const { bottom } = useSafeAreaInsets();
	const { height } = useKeyboardAnimation();
	const initialHeight = Platform.OS === 'ios' ? bottom : 0;
	const keyboardHeight = useSharedValue(initialHeight);
	const previousHeight = useSharedValue(initialHeight);

	const updateHeight = (force: boolean = false) => {
		'worklet';

		if (
			!force &&
			(showEmojiPickerSharedValue.value === true || showEmojiSearchbarSharedValue.value === true) &&
			previousHeight.value !== EMOJI_KEYBOARD_FIXED_HEIGHT
		) {
			return;
		}
		// On iOS, keyboard controller doesn't include bottom inset, so we add it when keyboard is closed
		// On Android, keyboard controller already includes it, so we don't add it
		const notch = Platform.OS === 'ios' && height.value === 0 ? bottom : 0;
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
			scheduleOnRN(setShowEmojiKeyboard, currentValue);
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
			scheduleOnRN(setShowEmojiSearchbar, currentValue);
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
