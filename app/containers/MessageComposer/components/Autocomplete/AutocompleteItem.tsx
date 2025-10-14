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
		case '#': {
			const subtitleIsUsername = item.id !== 'all' && item.id !== 'here' && item.t === 'd' && !!item.id;

			const usernameLabel = subtitleIsUsername ? i18n.t('Username') : '';
			const subtitle = item.subtitle ? item.subtitle : '';

			return `${item.title}. ${usernameLabel} ${subtitle}`.trim();
		}

		case ':':
			return `:${item.emoji}:`;

		case '/': {
			if (!item.subtitle) {
				return `/${item.title}.`;
			}

			const shouldTranslate = i18n.isTranslated(item.subtitle);
			let { subtitle } = item;

			if (shouldTranslate) {
				subtitle = i18n.t(item.subtitle);
			}

			return `/${item.title}. ${subtitle}`;
		}
		case '!': {
			let subtitle = '';
			if (item.subtitle) {
				if (i18n.isTranslated(item.subtitle)) {
					subtitle = i18n.t(item.subtitle);
				} else {
					subtitle = item.subtitle;
				}
			}
			return `${item.title}. ${subtitle}`.trim();
		}

		case 'loading':
			return i18n.t('Loading');

		default:
			return '';
	}
};

export const AutocompleteItem = ({ item, onPress }: IAutocompleteItemProps) => {
	'use memo';

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
