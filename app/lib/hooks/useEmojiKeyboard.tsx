import React, { createContext, ReactElement, useContext } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
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

export const useEmojiKeyboardHeight = () => {
	const { showEmojiPickerSharedValue } = useContext(EmojiKeyboardContext);
	const { bottom } = useSafeAreaInsets();
	const keyboardHeight = useSharedValue(-bottom);
	const emojiPickerHeight = useSharedValue(0);

	useKeyboardHandler(
		{
			// onStart: e => {
			// 	'worklet';
			// 	console.log('onStart height showEmojiKeyboard', e.height, showEmojiPickerSharedValue.value);
			// 	// if ((e.height === 0 && showEmojiPickerSharedValue.value) || (e.height > 0 && !showEmojiPickerSharedValue.value)) {
			// 	// 	console.log('onStart parado');
			// 	// 	return;
			// 	// }
			// 	// if (e.height === 0 && showEmojiPickerSharedValue.value) {
			// 	// 	keyboardHeight.value = 0;
			// 	// 	emojiPickerHeight.value = 290;
			// 	// 	return;
			// 	// }
			// 	// emojiPickerHeight.value = 0;
			// 	// const notch = e.height > 0 ? 0 : bottom;
			// 	// keyboardHeight.value = -e.height - notch;
			// },
			onStart: e => {
				'worklet';

				// keyboardHeight.value = -e.height;
				// keyboardHeight.value = e.height > 0 ? Math.max(e.height + OFFSET, totalOffset) : totalOffset;
				// iPad shows a tooltip sometimes and the height seems to be less than 70
				const height = e.height < 70 ? 0 : e.height;
				const notch = height > 0 || showEmojiPickerSharedValue.value ? 0 : bottom;
				keyboardHeight.value = height > 0 ? -Math.max(height, Math.abs(notch)) : -notch;
				emojiPickerHeight.value = showEmojiPickerSharedValue.value ? 302 + bottom - height : 0;
				console.log(
					'onMove e.height keyboardHeight.value emojiPickerHeight.value',
					e.height,
					keyboardHeight.value,
					emojiPickerHeight.value
				);
			}
			// onInteractive: e => {
			// 	'worklet';
			// 	console.log('onInteractive', e.height);
			// },
			// onEnd: e => {
			// 	'worklet';
			// 	// if ((e.height === 0 && showEmojiPickerSharedValue.value) || (e.height > 0 && !showEmojiPickerSharedValue.value)) {
			// 	// 	keyboardHeight.value = -e.height;
			// 	// 	console.log('onEnd setando');
			// 	// 	return;
			// 	// }
			// 	// keyboardHeight.value = -e.height;
			// 	console.log('onEnd', e.height);
			// }
		},
		[]
	);

	return { keyboardHeight, emojiPickerHeight };
};
