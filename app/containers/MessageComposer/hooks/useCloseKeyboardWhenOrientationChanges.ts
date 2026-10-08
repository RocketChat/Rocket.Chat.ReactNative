import { useEffect, useRef } from 'react';
import { Dimensions, Keyboard } from 'react-native';

const getIsPortrait = () => {
	// 'screen' is the physical display size and is NOT affected by the soft keyboard.
	// 'window'/safe-area frame shrink when the keyboard opens under adjustResize, which
	// on small screens can make a keyboard-open look like a rotation and wrongly dismiss
	// the keyboard right after it appears. Using 'screen' only reacts to real rotations.
	const { width, height } = Dimensions.get('screen');
	return width < height;
};

export const useCloseKeyboardWhenOrientationChanges = () => {
	const isPortrait = useRef(getIsPortrait());

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', () => {
			const portrait = getIsPortrait();
			if (portrait !== isPortrait.current) {
				isPortrait.current = portrait;
				Keyboard.dismiss();
			}
		});
		return () => subscription.remove();
	}, []);
};
