import { useRef } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

export const useCloseKeyboardWhenOrientationChanges = () => {
	const { width, height } = useSafeAreaFrame();
	const isPortrait = width < height;
	const previousOrientation = useRef(isPortrait);
	if (previousOrientation.current !== isPortrait) {
		Keyboard.dismiss();
		previousOrientation.current = isPortrait;
	}
};
