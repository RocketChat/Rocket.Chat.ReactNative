import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { isIOS } from '../../../lib/methods/helpers';

const useIOSBackSwipeHandler = () => {
	const navigation = useNavigation();
	const iOSBackSwipe = useRef(false);

	useEffect(() => {
		if (!isIOS) return;

		const transitionStartListener = navigation.addListener('transitionStart' as any, e => {
			if (e?.data?.closing) {
				iOSBackSwipe.current = true;
			}
		});

		const blurListener = navigation.addListener('blur', () => {
			Keyboard.dismiss();
		});

		return () => {
			transitionStartListener();
			blurListener();
		};
	}, []);

	return iOSBackSwipe;
};

export default useIOSBackSwipeHandler;
