import { MutableRefObject, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useMessageComposerApi } from '../context';
import { ITrackingView } from '../interfaces';
import { TKeyEmitterEvent, emitter } from '../../../lib/methods/helpers/emitter';
import { useRoomContext } from '../../../views/RoomView/context';

export const useKeyboardListener = (ref: MutableRefObject<ITrackingView>) => {
	const { setKeyboardHeight } = useMessageComposerApi();
	const { tmid } = useRoomContext();
	const isFocused = useIsFocused();
	useEffect(() => {
		if (!isFocused) {
			return;
		}
		const keyboardEvent: TKeyEmitterEvent = `setKeyboardHeight${tmid ? 'Thread' : ''}`;
		const showListener = Keyboard.addListener('keyboardWillShow', async () => {
			if (ref?.current) {
				const props = await ref.current.getNativeProps();
				setKeyboardHeight(props.keyboardHeight);
				emitter.emit(keyboardEvent, props.keyboardHeight);
			}
		});

		const hideListener = Keyboard.addListener('keyboardWillHide', () => {
			setKeyboardHeight(0);
			emitter.emit(keyboardEvent, 0);
		});

		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, [ref, setKeyboardHeight, tmid, isFocused]);
};
