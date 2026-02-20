import { memo, useContext } from 'react';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';

const RCTouchable: any = memo(function RCTouchable({ children, ...props }: any) {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Touchable onLongPress={onLongPress} {...props}>
			{children}
		</Touchable>
	);
});

RCTouchable.Ripple = function RCTouchableRipple(...args: Parameters<typeof Touchable.Ripple>) {
	return Touchable.Ripple(...args);
};
RCTouchable.SelectableBackgroundBorderless = function RCTouchableSelectableBackgroundBorderless() {
	return Touchable.SelectableBackgroundBorderless();
};

export default RCTouchable;
