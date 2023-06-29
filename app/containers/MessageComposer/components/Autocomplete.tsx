import { View } from 'react-native';
import { useContext, useEffect, useState } from 'react';

import { MessageComposerContext } from '../context';
import { search } from '../../../lib/methods';
import { TAutocompleteType } from '../interfaces';

const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			if (type === '@') {
				const res = await search({ text, filterRooms: false, filterUsers: true, rid });
				setItems(res);
			}
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};

export const Autocomplete = () => {
	const { rid, trackingViewHeight, autocompleteType, autocompleteText } = useContext(MessageComposerContext);
	console.log('🚀 ~ file: Autocomplete.tsx:8 ~ Autocomplete ~ autocompleteType:', autocompleteType, autocompleteText);
	const items = useAutocomplete({ text: autocompleteText, type: autocompleteType, rid });
	console.log('🚀 ~ file: Autocomplete.tsx:26 ~ Autocomplete ~ items:', items);

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
