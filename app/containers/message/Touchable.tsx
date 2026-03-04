import React, { useContext } from 'react';
import { Pressable } from 'react-native-gesture-handler';

import MessageContext from './Context';

const RCTouchable: any = React.memo(({ children, ...props }: any) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Pressable onLongPress={onLongPress} {...props}>
			{children}
		</Pressable>
	);
});

export default RCTouchable;
