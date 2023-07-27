import { RectButton } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';

import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { CustomIcon } from '../../../CustomIcon';

export const AutocompletePreview = ({ item, onPress }: IAutocompleteItemProps) => {
	const { colors } = useTheme();
	if (item.type === '/preview') {
		return (
			<RectButton
				onPress={() => onPress(item)}
				underlayColor={colors.buttonBackgroundPrimaryPress}
				style={{ backgroundColor: colors.surfaceLight }}
				rippleColor={colors.buttonBackgroundPrimaryPress}
			>
				{item.preview.type === 'image' ? (
					<FastImage
						style={{ height: 80, minWidth: 80, borderRadius: 4 }}
						source={{ uri: item.preview.value }}
						resizeMode={FastImage.resizeMode.cover}
					/>
				) : (
					<CustomIcon name='attach' size={36} color={colors.actionTintColor} />
				)}
			</RectButton>
		);
	}
	return null;
};
