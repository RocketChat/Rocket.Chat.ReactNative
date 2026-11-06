import { type TrueSheet } from '@lodev09/react-native-true-sheet';
import { type RefObject, useEffect } from 'react';
import { Keyboard } from 'react-native';

import { isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import { type TActionSheetOptions } from './Provider';

interface IUseExpandOnKeyboard {
	sheetRef: RefObject<TrueSheet | null>;
	isVisible: boolean;
	options: TActionSheetOptions;
	detentsCount: number;
}

export const useExpandOnKeyboard = ({ sheetRef, isVisible, options, detentsCount }: IUseExpandOnKeyboard): void => {
	const enabled = isVisible && !!options.expandOnKeyboard && detentsCount > 1;

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const showEvent = isIOS ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = isIOS ? 'keyboardWillHide' : 'keyboardDidHide';
		const onShow = Keyboard.addListener(showEvent, () => sheetRef.current?.resize(detentsCount - 1).catch(log));
		const onHide = Keyboard.addListener(hideEvent, () => sheetRef.current?.resize(0).catch(log));
		return () => {
			onShow.remove();
			onHide.remove();
		};
	}, [enabled, detentsCount, sheetRef]);
};
