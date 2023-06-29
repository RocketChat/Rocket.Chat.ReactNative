import { View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export const AutocompleteItem = ({ item, onPress }) => {
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
					borderWidth: 1,
					flexDirection: 'row',
					paddingHorizontal: 16,
					paddingVertical: 6,
					gap: 12
				}}
			>
				<View style={{ width: 36, height: 36, backgroundColor: colors.surfaceNeutral, borderRadius: 4 }} />
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<View style={{ flex: 1, flexDirection: 'row' }}>
						<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]}>Title</Text>
					</View>
					<View style={{ flex: 1, flexDirection: 'row' }}>
						<Text style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo }]}>Subtitle</Text>
					</View>
				</View>
			</View>
		</RectButton>
	);
};
