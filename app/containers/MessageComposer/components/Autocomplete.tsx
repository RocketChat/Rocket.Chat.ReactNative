import { View } from 'react-native';
import { useContext } from 'react';

import { MessageComposerContext } from '../context';

export const Autocomplete = () => {
	const { trackingViewHeight, autocompleteType, autocompleteText } = useContext(MessageComposerContext);
	console.log('🚀 ~ file: Autocomplete.tsx:8 ~ Autocomplete ~ autocompleteType:', autocompleteType, autocompleteText);

	return autocompleteType ? (
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
