import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { isIOS } from '../../../lib/methods/helpers';

const useIOSBackSwipeHandler = () => {
	const navigation = useNavigation();
	const iOSBackSwipe = useRef<boolean>(false);

	useEffect(() => {
		if (!isIOS) return;

		const transitionStartListener = navigation.addListener('transitionStart' as any, e => {
			if (e?.data?.closing) {
				iOSBackSwipe.current = true;
				Keyboard.dismiss();
			}
		});

		const transitionEndListener = navigation.addListener('transitionEnd' as any, () => {
			iOSBackSwipe.current = false;
		});

		return () => {
			transitionStartListener();
			transitionEndListener();
		};
	}, []);

	return { iOSBackSwipe };
};

export default useIOSBackSwipeHandler;
