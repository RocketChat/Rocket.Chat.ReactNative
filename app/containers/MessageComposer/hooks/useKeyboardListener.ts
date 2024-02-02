import { MutableRefObject, useEffect } from 'react';
import { Keyboard } from 'react-native';

import { useMessageComposerApi } from '../context';
import { ITrackingView } from '../interfaces';

export const useKeyboardListener = (ref: MutableRefObject<ITrackingView>) => {
	const { setKeyboardHeight } = useMessageComposerApi();
	useEffect(() => {
		const showListener = Keyboard.addListener('keyboardWillShow', async () => {
			if (ref?.current) {
				const props = await ref.current.getNativeProps();
				setKeyboardHeight(props.keyboardHeight);
			}
		});

		const hideListener = Keyboard.addListener('keyboardWillHide', () => {
			setKeyboardHeight(0);
		});

		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, [ref, setKeyboardHeight]);
};
