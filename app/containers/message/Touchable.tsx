import React, { useContext } from 'react';
import { Pressable } from 'react-native';

import MessageContext from './Context';

const RCTouchable: any = React.memo(({ children, ...props }: any) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Pressable {...props} onLongPress={onLongPress}>
			{children}
		</Pressable>
	);
});

export default RCTouchable;
