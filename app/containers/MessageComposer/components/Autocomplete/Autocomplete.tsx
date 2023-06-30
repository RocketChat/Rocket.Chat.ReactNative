import { View, FlatList } from 'react-native';
import { useContext } from 'react';

import { MessageComposerContext } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';

export const Autocomplete = ({ onPress }: { onPress: IAutocompleteItemProps['onPress'] }) => {
	const { rid, trackingViewHeight, keyboardHeight, autocompleteType, autocompleteText } = useContext(MessageComposerContext);
	console.log('🚀 ~ file: Autocomplete.tsx:8 ~ Autocomplete ~ autocompleteType:', autocompleteType, autocompleteText);
	const items = useAutocomplete({ text: autocompleteText, type: autocompleteType, rid });
	console.log('🚀 ~ file: Autocomplete.tsx:26 ~ Autocomplete ~ items:', items);
	const { colors } = useTheme();

	if (autocompleteType && items.length > 0) {
		return (
			<View
				style={{
					maxHeight: 216,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceNeutral,
					position: 'absolute',
					bottom: trackingViewHeight + keyboardHeight + 50,
					borderRadius: 4,
					shadowColor: 'rgb(47, 52, 61)',
					shadowOffset: {
						width: 0,
						height: 2
					},
					shadowOpacity: 0.1,
					shadowRadius: 6,
					elevation: 4
				}}
			>
				<FlatList
					contentContainerStyle={{
						borderRadius: 4,
						overflow: 'hidden'
					}}
					data={items}
					renderItem={({ item }) => <AutocompleteItem item={item} type={autocompleteType} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	}

	return null;
};
