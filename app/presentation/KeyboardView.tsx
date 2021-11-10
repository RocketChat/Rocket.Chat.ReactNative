import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from '@codler/react-native-keyboard-aware-scroll-view';

import scrollPersistTaps from '../utils/scrollPersistTaps';

interface IKeyboardViewProps extends KeyboardAwareScrollViewProps {
	keyboardVerticalOffset: number;
	children: React.ReactNode;
}

export default class KeyboardView extends React.PureComponent<IKeyboardViewProps, any> {
	render() {
		const { style, contentContainerStyle, scrollEnabled, keyboardVerticalOffset, children } = this.props;

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
	}
}
