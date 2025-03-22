import { useEffect, useState } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TKeyEmitterEvent, emitter } from '../../../../../lib/methods/helpers';
import { EDGE_DISTANCE } from '../../constants';

export const useNavBottomStyle = (isThread: boolean): ViewStyle => {
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [composerHeight, setComposerHeight] = useState(0);
	const { bottom } = useSafeAreaInsets();

	useEffect(() => {
		const keyboardEvent: TKeyEmitterEvent = `setKeyboardHeight${isThread ? 'Thread' : ''}`;
		const composerEvent: TKeyEmitterEvent = `setComposerHeight${isThread ? 'Thread' : ''}`;
		emitter.on(keyboardEvent, height => {
			if (height !== keyboardHeight) {
				setKeyboardHeight(height);
			}
		});
		emitter.on(composerEvent, height => {
			if (height !== composerHeight) {
				setComposerHeight(height);
			}
		});

		return () => {
			emitter.off(keyboardEvent);
			emitter.off(composerEvent);
		};
	}, [isThread, keyboardHeight, composerHeight]);

	return {
		bottom: keyboardHeight + composerHeight + (keyboardHeight ? 0 : bottom) + EDGE_DISTANCE
	};
};
