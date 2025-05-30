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

// Create default shared values outside of React component lifecycle
const defaultShowEmojiPickerSharedValue = { value: false } as SharedValue<boolean>;
const defaultShowEmojiSearchbarSharedValue = { value: false } as SharedValue<boolean>;

const EmojiKeyboardContext = createContext<IEmojiKeyboardContextProps>({
	showEmojiPickerSharedValue: defaultShowEmojiPickerSharedValue,
	showEmojiSearchbarSharedValue: defaultShowEmojiSearchbarSharedValue
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

/**
 * Hook for managing emoji keyboard state and providing React state synchronization.
 * This hook handles the emoji picker open/close state and syncs it with React state
 * for components that need to re-render based on emoji picker visibility.
 */
export const useEmojiKeyboard = () => {
	const { showEmojiPickerSharedValue, showEmojiSearchbarSharedValue } = useContext(EmojiKeyboardContext);
	const { focus } = useContext(MessageInnerContext);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showEmojiSearchbar, setShowEmojiSearchbar] = useState(false);

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

	// Sync shared value with React state for proper re-renders
	// This maintains single source of truth while enabling React updates
	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null || currentValue === previousValue) {
				return;
			}
			runOnJS(setShowEmojiKeyboard)(currentValue);
		},
		[showEmojiPickerSharedValue]
	);

	// Sync emoji searchbar shared value with React state
	useAnimatedReaction(
		() => showEmojiSearchbarSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null || currentValue === previousValue) {
				return;
			}
			runOnJS(setShowEmojiSearchbar)(currentValue);
		},
		[showEmojiSearchbarSharedValue]
	);

	return {
		showEmojiPickerSharedValue,
		showEmojiKeyboard,
		openEmojiKeyboard,
		closeEmojiKeyboard,
		showEmojiSearchbarSharedValue,
		showEmojiSearchbar,
		openEmojiSearchbar,
		closeEmojiSearchbar
	};
};

const IPAD_TOOLTIP_HEIGHT_OR_HW_KEYBOARD = 70;
const EMOJI_KEYBOARD_FIXED_HEIGHT = 300;

export const useKeyboardAnimation = () => {
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

/**
 * Hook for managing emoji keyboard height animations and keyboard event handling.
 * This hook uses a derived value to calculate the final keyboard height based on
 * keyboard events, emoji picker state, emoji searchbar state, and device notch.
 * It consolidates all height logic into a single reactive computation.
 */
export const useEmojiKeyboardHeight = () => {
	const { showEmojiPickerSharedValue, showEmojiSearchbarSharedValue } = useContext(EmojiKeyboardContext);
	const { bottom } = useSafeAreaInsets();
	const { height } = useKeyboardAnimation();
	const newValue = useSharedValue(bottom);
	const previousHeight = useSharedValue(bottom);

	const updateHeight = () => {
		'worklet';

		if (
			(showEmojiPickerSharedValue.value === true || showEmojiSearchbarSharedValue.value === true) &&
			previousHeight.value !== EMOJI_KEYBOARD_FIXED_HEIGHT
		) {
			return;
		}
		const notch = height.value > 0 ? 0 : bottom;
		newValue.value = height.value + notch;
		previousHeight.value = newValue.value;
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
			newValue.value = EMOJI_KEYBOARD_FIXED_HEIGHT;
			previousHeight.value = newValue.value;
		}
	};

	useAnimatedReaction(
		() => showEmojiPickerSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null) {
				return;
			}
			if (currentValue === true) {
				openEmojiPicker();
			} else if (previousHeight.value === EMOJI_KEYBOARD_FIXED_HEIGHT) {
				updateHeight();
			}
		},
		[showEmojiPickerSharedValue]
	);

	useAnimatedReaction(
		() => showEmojiSearchbarSharedValue.value,
		(currentValue, previousValue) => {
			if (previousValue === null) {
				return;
			}
			if (currentValue === true && previousHeight.value === EMOJI_KEYBOARD_FIXED_HEIGHT) {
				updateHeight();
			} else if (currentValue === false) {
				openEmojiPicker();
			}
		},
		[showEmojiSearchbarSharedValue]
	);

	return { keyboardHeight: newValue };
};
