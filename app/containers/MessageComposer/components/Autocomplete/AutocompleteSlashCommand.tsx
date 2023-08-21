import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteSlashCommand } from '../../interfaces';
import I18n from '../../../../i18n';

export const AutocompleteSlashCommand = ({ item }: { item: IAutocompleteSlashCommand }) => {
	const { colors } = useTheme();
	return (
		<>
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						/{item.title}
					</Text>
				</View>
				{item.subtitle ? (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 }}>
						<Text style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}>
							{I18n.isTranslated(item.subtitle) ? I18n.t(item.subtitle) : item.subtitle}
						</Text>
					</View>
				) : null}
			</View>
		</>
	);
};
