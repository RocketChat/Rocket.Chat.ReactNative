import React from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompleteUserRoom } from './AutocompleteUserRoom';
import { AutocompleteEmoji } from './AutocompleteEmoji';
import { AutocompleteSlashCommand } from './AutocompleteSlashCommand';
import { AutocompleteCannedResponse } from './AutocompleteCannedResponse';
import { AutocompleteItemLoading } from './AutocompleteItemLoading';
import { useStyle } from './styles';

export const AutocompleteItem = ({ item, onPress }: IAutocompleteItemProps) => {
	const [styles, colors] = useStyle();
	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
		>
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
