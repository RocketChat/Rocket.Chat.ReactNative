import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { type ParamListBase, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { isIOS } from '../../../lib/methods/helpers';

const useIOSBackSwipeHandler = () => {
	'use memo';

	const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
	const iOSBackSwipe = useRef<boolean>(false);

	useEffect(() => {
		if (!isIOS) return;

		const transitionStartListener = navigation.addListener('transitionStart', e => {
			if (e?.data?.closing) {
				iOSBackSwipe.current = true;
			}
		});

		const transitionEndListener = navigation.addListener('transitionEnd', () => {
			iOSBackSwipe.current = false;
		});

		const blurListener = navigation.addListener('blur', () => {
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
