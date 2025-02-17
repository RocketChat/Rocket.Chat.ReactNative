import React from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { IAutocompleteItemProps, TAutocompleteItem } from '../../interfaces';
import { AutocompleteUserRoom } from './AutocompleteUserRoom';
import { AutocompleteEmoji } from './AutocompleteEmoji';
import { AutocompleteSlashCommand } from './AutocompleteSlashCommand';
import { AutocompleteCannedResponse } from './AutocompleteCannedResponse';
import { AutocompleteItemLoading } from './AutocompleteItemLoading';
import { useStyle } from './styles';

const getTestIDSuffix = (item: TAutocompleteItem) => {
	if ('title' in item) {
		return item.title;
	}
	if ('emoji' in item) {
		return item.emoji;
	}
	return item.id;
};

export const AutocompleteItem = ({ item, onPress }: IAutocompleteItemProps) => {
	const [styles, colors] = useStyle();
	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
			testID={`autocomplete-item-${getTestIDSuffix(item)}`}>
			<View style={styles.item}>
				{item.type === '@' || item.type === '#' ? <AutocompleteUserRoom item={item} /> : null}
				{item.type === ':' ? <AutocompleteEmoji item={item} /> : null}
				{item.type === '/' ? <AutocompleteSlashCommand item={item} /> : null}
				{item.type === '!' ? <AutocompleteCannedResponse item={item} /> : null}
				{item.type === 'loading' ? <AutocompleteItemLoading /> : null}
			</View>
		</RectButton>
	);
};
