import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteSlashCommand } from '../../interfaces';

export const AutocompleteSlashCommand = ({ item }: { item: IAutocompleteSlashCommand }) => {
	const { colors } = useTheme();
	return (
		<>
			<View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						/{item.title}
					</Text>
				</View>
				{item.subtitle ? (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}>
							{item.subtitle}
						</Text>
					</View>
				) : null}
			</View>
		</>
	);
};
