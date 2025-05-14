import React, { createContext, ReactElement, useContext } from 'react';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

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
	const keyboardHeight = useSharedValue(0);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';
				console.log('onStart height showEmojiKeyboard', e.height, showEmojiPickerSharedValue.value);
				// if ((e.height === 0 && showEmojiPickerSharedValue.value) || (e.height > 0 && !showEmojiPickerSharedValue.value)) {
				// 	console.log('onStart parado');
				// 	return;
				// }
				// if (e.height === 0 && showEmojiPickerSharedValue.value) {
				// 	keyboardHeight.value = 0;
				// 	return;
				// }
				keyboardHeight.value = -e.height;
			},
			onMove: e => {
				'worklet';
				// keyboardHeight.value = -e.height;
				console.log('onMove', e.height);
			},
			onInteractive: e => {
				'worklet';
				console.log('onInteractive', e.height);
			},
			onEnd: e => {
				'worklet';
				// if ((e.height === 0 && showEmojiPickerSharedValue.value) || (e.height > 0 && !showEmojiPickerSharedValue.value)) {
				// 	keyboardHeight.value = -e.height;
				// 	console.log('onEnd setando');
				// 	return;
				// }
				// keyboardHeight.value = -e.height;
				console.log('onEnd', e.height);
			}
		},
		[]
	);

	return keyboardHeight;
};
