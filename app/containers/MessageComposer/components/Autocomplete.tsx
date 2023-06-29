import { View } from 'react-native';
import { useContext } from 'react';

import { MessageComposerContext } from '../context';

export const Autocomplete = () => {
	const { trackingViewHeight } = useContext(MessageComposerContext);

	return trackingViewHeight ? (
		<View
			style={{
				height: 100,
				left: 8,
				right: 8,
				backgroundColor: '#00000080',
				position: 'absolute',
				bottom: trackingViewHeight + 50
			}}
		/>
	) : null;
};
