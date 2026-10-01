import { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { usePrevious } from '~/lib/hooks/usePrevious';

export const useCloseKeyboardWhenOrientationChanges = () => {
	const { width, height } = useSafeAreaFrame();
	const isPortrait = width < height;
	const wasPortrait = usePrevious(isPortrait);

	useEffect(() => {
		if (wasPortrait !== isPortrait) {
			Keyboard.dismiss();
		}
	}, [wasPortrait, isPortrait]);
};
