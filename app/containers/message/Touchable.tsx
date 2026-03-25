import React, { useContext } from 'react';
import { Pressable, type PressableProps } from 'react-native';
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
	const { onHoverIn, onHoverOut, ...rest } = props;

	return (
		<KeyboardPressable
			focusable
			onLongPress={onLongPress}
			onHoverIn={onHoverIn || undefined}
			onHoverOut={onHoverOut || onLongPress}
			{...rest}>
			{children}
		</KeyboardPressable>
	);
});

export default RCTouchable;
