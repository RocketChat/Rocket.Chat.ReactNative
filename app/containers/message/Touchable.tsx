import React, { useContext } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import MessageContext from './Context';

interface IProps extends PressableProps {
	children: React.ReactNode;
	onLongPress?: () => void;
}

const RCTouchable: React.FC<IProps> = React.memo(({ children, ...props }) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Pressable onLongPress={onLongPress} {...props}>
			{children}
		</Pressable>
	);
});

export default RCTouchable;
