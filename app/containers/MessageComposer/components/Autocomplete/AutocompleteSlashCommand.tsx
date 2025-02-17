import React from 'react';
import { View, Text } from 'react-native';

import { IAutocompleteSlashCommand } from '../../interfaces';
import I18n from '../../../../i18n';
import { useStyle } from './styles';

export const AutocompleteSlashCommand = ({ item }: { item: IAutocompleteSlashCommand }) => {
	const [styles] = useStyle();
	return (
		<View style={styles.slashItem}>
			<View style={styles.slashTitle}>
				<Text style={styles.slashTitleText} numberOfLines={1}>
					/{item.title}
				</Text>
			</View>
			{item.subtitle ? (
				<View style={styles.slashSubtitle}>
					<Text style={styles.slashSubtitleText}>{I18n.isTranslated(item.subtitle) ? I18n.t(item.subtitle) : item.subtitle}</Text>
				</View>
			) : null}
		</View>
	);
};
