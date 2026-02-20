import React, { useContext } from 'react';

import MessageContext from './Context';
import Touch from '../Touch';

const RCTouchable: any = React.memo(({ children, ...props }: any) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Touch onLongPress={onLongPress} {...props}>
			{children}
		</Touch>
	);
});

export default RCTouchable;
