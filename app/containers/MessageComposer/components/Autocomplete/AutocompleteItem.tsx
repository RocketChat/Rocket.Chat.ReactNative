import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompleteEmoji } from './AutocompleteEmoji';
import { AutocompleteUserRoom } from './AutocompleteUserRoom';

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
					gap: 12,
					alignItems: 'center'
				}}
			>
				{item.type === '@' || item.type === '#' ? <AutocompleteUserRoom item={item} /> : null}
				{item.type === ':' ? <AutocompleteEmoji item={item} /> : null}
			</View>
		</RectButton>
	);
};
