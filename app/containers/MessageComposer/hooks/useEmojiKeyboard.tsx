import { createContext, useContext, useState, type ReactElement } from 'react';
import { Keyboard } from 'react-native';
import { KeyboardController, useKeyboardHandler } from 'react-native-keyboard-controller';
import { type SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

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

const MAX_ACCESSORY_BAR_HEIGHT = 120;
const EMOJI_KEYBOARD_FIXED_HEIGHT = 250;

const dismissKeyboardThatOutranPicker = () => KeyboardController.dismiss({ keepFocus: true });

export const EmojiKeyboardProvider = ({ children }: IEmojiKeyboardProvider) => {
	const showEmojiPickerSharedValue = useSharedValue(false);
	const showEmojiSearchbarSharedValue = useSharedValue(false);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				if (e.height > MAX_ACCESSORY_BAR_HEIGHT && !showEmojiSearchbarSharedValue.get()) {
					showEmojiPickerSharedValue.set(false);
				}
			},
			onEnd: e => {
				'worklet';

				if (e.height > MAX_ACCESSORY_BAR_HEIGHT && showEmojiPickerSharedValue.get() && !showEmojiSearchbarSharedValue.get()) {
					scheduleOnRN(dismissKeyboardThatOutranPicker);
				}
			}
		},
		[]
	);

	return (
		<EmojiKeyboardContext.Provider value={{ showEmojiPickerSharedValue, showEmojiSearchbarSharedValue }}>
			{children}
		</EmojiKeyboardContext.Provider>
	);
};

const useKeyboardAnimation = () => {
	const height = useSharedValue(0);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				if (e.duration === 0) {
					return;
				}
				height.set(e.height);
			},
			onInteractive: e => {
				'worklet';

				height.set(e.height);
			},
			onEnd: e => {
				'worklet';

				height.set(Math.max(e.height, 0));
			}
		},
		[]
	);

	return { height };
};

export const useEmojiKeyboard = () => {
	const { showEmojiPickerSharedValue, showEmojiSearchbarSharedValue } = useContext(EmojiKeyboardContext);
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
			(showEmojiPickerSharedValue.get() === true || showEmojiSearchbarSharedValue.get() === true) &&
			previousHeight.get() !== EMOJI_KEYBOARD_FIXED_HEIGHT
		) {
			return;
		}
		// When keyboard is closed, add bottom safe area inset to ensure content is visible above
		// navigation bars/home indicator. When keyboard is open, keyboard height already covers it.
		const notch = height.get() === 0 ? bottom : 0;
		keyboardHeight.set(height.get() + notch);
		const searchingFromFixedPicker =
			showEmojiSearchbarSharedValue.get() === true && previousHeight.get() === EMOJI_KEYBOARD_FIXED_HEIGHT;
		if (!searchingFromFixedPicker) {
			previousHeight.set(keyboardHeight.get());
		}
	};

	const openEmojiKeyboard = () => {
		showEmojiPickerSharedValue.set(true);
	};

	const closeEmojiKeyboard = () => {
		showEmojiPickerSharedValue.set(false);
	};

	const openEmojiSearchbar = () => {
		showEmojiSearchbarSharedValue.set(true);
	};

	const backToEmojiPicker = () => {
		showEmojiSearchbarSharedValue.set(false);
		Keyboard.dismiss();
	};

	const resetKeyboard = () => {
		updateHeight(true);
		closeEmojiKeyboard();
		showEmojiSearchbarSharedValue.set(false);
	};

	const openEmojiPicker = () => {
		'worklet';

		if (keyboardHeight.get() < MAX_ACCESSORY_BAR_HEIGHT) {
			keyboardHeight.set(EMOJI_KEYBOARD_FIXED_HEIGHT);
			previousHeight.set(keyboardHeight.get());
		}
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
			if (currentValue < MAX_ACCESSORY_BAR_HEIGHT && showEmojiPickerSharedValue.value && !showEmojiSearchbarSharedValue.value) {
				openEmojiPicker();
			}
		},
		[height]
	);

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
		backToEmojiPicker,
		resetKeyboard
	};
};
