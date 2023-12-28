import React, { ReactElement } from 'react';
import { View, FlatList } from 'react-native';

import { useAutocompleteParams, useKeyboardHeight, useTrackingViewHeight } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { useRoom } from '../../../../contexts/RoomContext';
import { useStyle, getBottom } from './styles';

export const Autocomplete = ({ onPress }: { onPress: IAutocompleteItemProps['onPress'] }): ReactElement | null => {
	const { rid } = useRoom();
	const trackingViewHeight = useTrackingViewHeight();
	const keyboardHeight = useKeyboardHeight();
	const { text, type, params } = useAutocompleteParams();
	const items = useAutocomplete({
		rid,
		text,
		type,
		commandParams: params
	});
	const [styles, colors] = useStyle();

	if (items.length === 0 || !type) {
		return null;
	}

	if (type !== '/preview') {
		return (
			<View
				style={[
					styles.root,
					{
						bottom: getBottom(trackingViewHeight, keyboardHeight)
					}
				]}
			>
				<FlatList
					contentContainerStyle={styles.listContentContainer}
					data={items}
					renderItem={({ item }) => <AutocompleteItem item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
					testID='autocomplete'
				/>
			</View>
		);
	}

	if (type === '/preview') {
		return (
			<View
				style={[styles.root, { backgroundColor: colors.surfaceLight, bottom: getBottom(trackingViewHeight, keyboardHeight) }]}
			>
				<FlatList
					contentContainerStyle={styles.listContentContainer}
					style={styles.list}
					horizontal
					data={items}
					renderItem={({ item }) => <AutocompletePreview item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
					testID='autocomplete'
				/>
			</View>
		);
	}

	return null;
};
