import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from '@codler/react-native-keyboard-aware-scroll-view';

import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';

interface IKeyboardViewProps extends KeyboardAwareScrollViewProps {
	keyboardVerticalOffset?: number;
	scrollEnabled?: boolean;
	children: React.ReactElement[] | React.ReactElement;
}

const KeyboardView = ({ style, contentContainerStyle, scrollEnabled, keyboardVerticalOffset, children }: IKeyboardViewProps) => (
	<KeyboardAwareScrollView
		{...scrollPersistTaps}
		style={style}
		contentContainerStyle={contentContainerStyle}
		scrollEnabled={scrollEnabled}
		alwaysBounceVertical={false}
		extraHeight={keyboardVerticalOffset}>
		{children}
	</KeyboardAwareScrollView>
);

export default KeyboardView;
