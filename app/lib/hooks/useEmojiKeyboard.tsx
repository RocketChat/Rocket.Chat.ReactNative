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
	const keyboardHeight = useSharedValue(bottom);

	useKeyboardHandler(
		{
			onStart: e => {
				'worklet';

				if (showEmojiPickerSharedValue.value === false) {
					// iPad shows a tooltip sometimes and the height seems to be less than 70
					const height = e.height < 70 ? 0 : e.height;
					const notch = height > 0 ? 0 : bottom;
					keyboardHeight.value = e.height + notch;
				}
			}
		},
		[]
	);

	return { keyboardHeight };
};
