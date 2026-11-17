import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

export const useCloseKeyboardWhenOrientationChanges = () => {
	const { width, height } = useSafeAreaFrame();
	const isPortrait = width < height;
	const wasPortraitRef = useRef(isPortrait);

	useEffect(() => {
		if (wasPortraitRef.current !== isPortrait) {
			wasPortraitRef.current = isPortrait;
			Keyboard.dismiss();
		}
	}, [isPortrait]);
};
