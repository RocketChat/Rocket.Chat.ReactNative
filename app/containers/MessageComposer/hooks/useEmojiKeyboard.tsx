import React, { createContext, ReactElement, useContext, useState } from 'react';
import { KeyboardController, useKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IEmojiKeyboardProvider {
	children: ReactElement | null;
}

interface IEmojiKeyboardContextProps {
	showEmojiPickerSharedValue: SharedValue<boolean>;
	showEmojiSearchbarSharedValue: SharedValue<boolean>;
}

const EmojiKeyboardContext = createContext<IEmojiKeyboardContextProps>({} as IEmojiKeyboardContextProps);

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

	const closeEmojiSearchbar = async () => {
		showEmojiSearchbarSharedValue.value = false;
		await KeyboardController.setFocusTo('current');
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

	// Sync emoji searchbar shared value with React state
	useAnimatedReaction(
		() => showEmojiSearchbarSharedValue.value,
		currentValue => {
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
	const { height: currentKeyboardHeight } = useKeyboardAnimation();
	const previousKeyboardHeight = useSharedValue(bottom);

	const keyboardHeight = useDerivedValue(() => {
		const isEmojiPickerOpen = showEmojiPickerSharedValue.value;
		const isEmojiSearchbarOpen = showEmojiSearchbarSharedValue.value;
		const currentRawHeight = currentKeyboardHeight.value;
		const previousHeight = previousKeyboardHeight.value;

		if (currentRawHeight === previousHeight) {
			return previousHeight;
		}

		if (isEmojiPickerOpen || isEmojiSearchbarOpen) {
			if (previousHeight < IPAD_TOOLTIP_HEIGHT_OR_HW_KEYBOARD) {
				return EMOJI_KEYBOARD_FIXED_HEIGHT;
			}
			return previousHeight;
		}

		const notch = currentRawHeight > 0 ? 0 : bottom;
		const newKeyboardHeight = currentRawHeight + notch;
		previousKeyboardHeight.value = newKeyboardHeight;
		return newKeyboardHeight;
	}, [showEmojiPickerSharedValue, showEmojiSearchbarSharedValue, currentKeyboardHeight, bottom, previousKeyboardHeight]);

	useDerivedValue(() => {
		console.log('keyboardHeight', keyboardHeight.value);
	});

	return { keyboardHeight };
};
