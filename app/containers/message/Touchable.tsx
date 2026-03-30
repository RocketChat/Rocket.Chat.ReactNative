import React, { useContext } from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import MessageContext from './Context';

interface IProps extends PressableProps {
	children: React.ReactNode;
	onLongPress?: () => void;
}

const KeyboardPressable = withKeyboardFocus(Pressable);

const RCTouchable: React.FC<IProps> = React.memo(({ children, ...props }) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);
	const { onHoverIn, onHoverOut, testID, nativeID, ...rest } = props;

	const pressable = (
		<KeyboardPressable
			focusable
			onLongPress={onLongPress}
			onHoverIn={onHoverIn || undefined}
			onHoverOut={onHoverOut || onLongPress}
			{...rest}>
			{children}
		</KeyboardPressable>
	);

	if (testID == null && nativeID == null) {
		return pressable;
	}

	return (
		<View collapsable={Platform.OS === 'android' ? false : undefined} nativeID={nativeID} testID={testID}>
			{pressable}
		</View>
	);
});

export default RCTouchable;
