import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { isIOS } from '../../../lib/methods/helpers';

const useIOSBackSwipeHandler = () => {
	'use memo';

	const navigation = useNavigation();
	const iOSBackSwipe = useRef<boolean>(false);

	useEffect(() => {
		if (!isIOS) return;

		const transitionStartListener = navigation.addListener('transitionStart' as any, e => {
			if (e?.data?.closing) {
				iOSBackSwipe.current = true;
			}
		});

		const transitionEndListener = navigation.addListener('transitionEnd' as any, () => {
			iOSBackSwipe.current = false;
		});

		const blurListener = navigation.addListener('blur' as any, () => {
			Keyboard.dismiss();
		});

		return () => {
			blurListener();
			transitionStartListener();
			transitionEndListener();
		};
	}, []);

	return { iOSBackSwipe };
};

export default useIOSBackSwipeHandler;
