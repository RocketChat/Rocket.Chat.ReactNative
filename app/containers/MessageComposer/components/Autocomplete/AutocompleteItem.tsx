import React from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompleteUserRoom } from './AutocompleteUserRoom';
import { AutocompleteEmoji } from './AutocompleteEmoji';
import { AutocompleteSlashCommand } from './AutocompleteSlashCommand';
import { AutocompleteCannedResponse } from './AutocompleteCannedResponse';
import { AutocompleteItemLoading } from './AutocompleteItemLoading';

export const AutocompleteItem = ({ item, onPress }: IAutocompleteItemProps) => {
	const { colors } = useTheme();
	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
		>
			<View
				style={{
					minHeight: 48,
					flexDirection: 'row',
					paddingHorizontal: 16,
					paddingVertical: 6,
					alignItems: 'center'
				}}
			>
				{item.type === '@' || item.type === '#' ? <AutocompleteUserRoom item={item} /> : null}
				{item.type === ':' ? <AutocompleteEmoji item={item} /> : null}
				{item.type === '/' ? <AutocompleteSlashCommand item={item} /> : null}
				{item.type === '!' ? <AutocompleteCannedResponse item={item} /> : null}
				{item.type === 'loading' ? <AutocompleteItemLoading /> : null}
			</View>
		</RectButton>
	);
};
