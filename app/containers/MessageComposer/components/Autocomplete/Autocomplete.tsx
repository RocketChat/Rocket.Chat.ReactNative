import { View, FlatList } from 'react-native';
import { useContext } from 'react';

import { MessageComposerContext } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';

export const Autocomplete = () => {
	const { rid, trackingViewHeight, keyboardHeight, autocompleteType, autocompleteText } = useContext(MessageComposerContext);
	console.log('🚀 ~ file: Autocomplete.tsx:8 ~ Autocomplete ~ autocompleteType:', autocompleteType, autocompleteText);
	const items = useAutocomplete({ text: autocompleteText, type: autocompleteType, rid });
	console.log('🚀 ~ file: Autocomplete.tsx:26 ~ Autocomplete ~ items:', items);

	if (autocompleteType && items.length > 0) {
		return (
			<View
				style={{
					height: 100,
					left: 8,
					right: 8,
					backgroundColor: '#00000080',
					position: 'absolute',
					bottom: trackingViewHeight + keyboardHeight + 50
				}}
			>
				<FlatList data={items} renderItem={({ item }) => <AutocompleteItem item={item} onPress={() => {}} />} />
			</View>
		);
	}

	return null;
};
