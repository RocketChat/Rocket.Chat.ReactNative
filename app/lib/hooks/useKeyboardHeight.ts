import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Taken from https://github.com/gie3d/react-native-use-keyboard-height/blob/master/src/index.tsx

export const useKeyboardHeight = () => {
	const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
	useEffect(() => {
		Keyboard.addListener('keyboardDidShow', keyboardDidShow);
		Keyboard.addListener('keyboardDidHide', keyboardDidHide);

		// cleanup function
		return () => {
			Keyboard.removeListener('keyboardDidShow', keyboardDidShow);
			Keyboard.removeListener('keyboardDidHide', keyboardDidHide);
		};
	}, []);

	const keyboardDidShow = (frames: any) => {
		setKeyboardHeight(frames.endCoordinates.height);
	};

	const keyboardDidHide = () => {
		setKeyboardHeight(0);
	};

	return keyboardHeight;
};
