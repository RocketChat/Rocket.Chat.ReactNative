import React, { useContext } from 'react';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';

const RCTouchable: any = React.memo(({ children, ...props }: any) => {
	const { onLongPress } = useContext(MessageContext);

	return (
		<Touchable onLongPress={onLongPress} {...props}>
			{children}
		</Touchable>
	);
});

// @ts-ignore
RCTouchable.Ripple = (...args: any[]) => Touchable.Ripple(...args);
RCTouchable.SelectableBackgroundBorderless = () => Touchable.SelectableBackgroundBorderless();

export default RCTouchable;
