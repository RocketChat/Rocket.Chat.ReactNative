import React from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import i18n from '../../../../i18n';
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

const getAutocompleteAccessibilityLabel = (item: TAutocompleteItem): string => {
	switch (item.type) {
		case '@':
		case '#':
			return `${item.title}. ${item.id !== 'all' && item.id !== 'here' ? i18n.t('Username') : ''} ${item.subtitle ?? ''}`.trim();

		case ':':
			return `:${item.emoji}:`;

		case '/':
			return `/${item.title}. ${item.subtitle ? item.subtitle : ''}`;

		case '!':
			let subtitle = '';
			if (item.subtitle) {
				subtitle = i18n.isTranslated(item.subtitle) ? i18n.t(item.subtitle) : item.subtitle;
			}
			return `${item.title}. ${subtitle}`.trim();

		case 'loading':
			return i18n.t('Loading');

		default:
			return '';
	}
};

export const AutocompleteItem = ({ item, onPress }: IAutocompleteItemProps) => {
	const [styles, colors] = useStyle();
	const autocompleteAccessibilityLabel = getAutocompleteAccessibilityLabel(item);
	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
			testID={`autocomplete-item-${getTestIDSuffix(item)}`}>
			<View accessible accessibilityLabel={autocompleteAccessibilityLabel} style={styles.item}>
				{item.type === '@' || item.type === '#' ? <AutocompleteUserRoom item={item} /> : null}
				{item.type === ':' ? <AutocompleteEmoji item={item} /> : null}
				{item.type === '/' ? <AutocompleteSlashCommand item={item} /> : null}
				{item.type === '!' ? <AutocompleteCannedResponse item={item} /> : null}
				{item.type === 'loading' ? <AutocompleteItemLoading /> : null}
			</View>
		</RectButton>
	);
};
