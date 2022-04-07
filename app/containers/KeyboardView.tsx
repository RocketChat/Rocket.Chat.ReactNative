import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from '@codler/react-native-keyboard-aware-scroll-view';

import scrollPersistTaps from '../utils/scrollPersistTaps';

interface IKeyboardViewProps extends KeyboardAwareScrollViewProps {
	keyboardVerticalOffset?: number;
	scrollEnabled?: boolean;
	children: React.ReactElement[] | React.ReactElement;
}

const KeyboardView = (props: IKeyboardViewProps) => {
	const { style, contentContainerStyle, scrollEnabled, keyboardVerticalOffset, children } = props;
	return (
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
};

export default KeyboardView;
