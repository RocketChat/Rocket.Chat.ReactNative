import React from 'react';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';

import scrollPersistTaps from '../utils/scrollPersistTaps';

interface IKeyboardViewProps {
	style: any;
	contentContainerStyle: any;
	keyboardVerticalOffset: number;
	scrollEnabled: boolean;
	children: JSX.Element;
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
				extraHeight={keyboardVerticalOffset}
				// @ts-ignore
				behavior='position'>
				{children}
			</KeyboardAwareScrollView>
		);
	}
}
