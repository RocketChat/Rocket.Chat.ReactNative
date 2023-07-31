import { View, FlatList } from 'react-native';
import { ReactElement, useContext, useEffect, useState } from 'react';

import { MessageComposerContext } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps, TAutocompleteType } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { emitter } from '../../emitter';

interface IAutocompleteData {
	type: TAutocompleteType;
	text: string;
	params?: string;
}

export const Autocomplete = ({ onPress }: { onPress: IAutocompleteItemProps['onPress'] }): ReactElement | null => {
	const { rid, trackingViewHeight, keyboardHeight } = useContext(MessageComposerContext);
	const [autocompleteData, setAutocompleteData] = useState<IAutocompleteData>({ type: null, text: '', params: '' });
	const items = useAutocomplete({
		rid,
		text: autocompleteData.text,
		type: autocompleteData.type,
		commandParams: autocompleteData.params
	});
	const { colors } = useTheme();

	useEffect(() => {
		emitter.on('setAutocomplete', ({ text, type, params = '' }) => {
			setAutocompleteData({ text, type, params });
		});
		return () => emitter.off('setAutocomplete');
	}, [rid]);

	if (items.length === 0 || !autocompleteData.type) {
		return null;
	}

	if (autocompleteData.type !== '/preview') {
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
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 2
					},
					shadowOpacity: 0.5,
					shadowRadius: 2,
					elevation: 4
				}}
			>
				<FlatList
					contentContainerStyle={{
						borderRadius: 4,
						overflow: 'hidden'
					}}
					data={items}
					renderItem={({ item }) => <AutocompleteItem item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	}

	if (autocompleteData.type === '/preview') {
		return (
			<View
				style={{
					maxHeight: 216,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceLight,
					position: 'absolute',
					bottom: trackingViewHeight + keyboardHeight + 50,
					borderRadius: 4,
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 2
					},
					shadowOpacity: 0.5,
					shadowRadius: 2,
					elevation: 4
				}}
			>
				<FlatList
					contentContainerStyle={{
						borderRadius: 4,
						overflow: 'hidden',
						gap: 4
					}}
					style={{ margin: 8 }}
					horizontal
					data={items}
					renderItem={({ item }) => <AutocompletePreview item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	}

	return null;
};
