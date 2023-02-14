import React from 'react';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from '@codler/react-native-keyboard-aware-scroll-view';
import { Keyboard, Pressable } from 'react-native';

import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from '../views/Styles';

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
		extraHeight={keyboardVerticalOffset}
	>
		{/** Use Pressable instead of TouchableWithoutFeedback, because the TouchableWithoutFeedback requires a view wrapping the children
		 * and this wrapping is causing wrong behavior on ScrollView
		 * https://stackoverflow.com/a/74456534
		 *  */}
		<Pressable style={sharedStyles.container} onPress={() => Keyboard.dismiss()}>
			{children}
		</Pressable>
	</KeyboardAwareScrollView>
);

export default KeyboardView;
