import { RectButton } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';

import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { CustomIcon } from '../../../CustomIcon';
import { AutocompleteItemLoading } from './AutocompleteItemLoading';

export const AutocompletePreview = ({ item, onPress }: IAutocompleteItemProps) => {
	const { colors } = useTheme();

	let content;
	if (item.type === 'loading') {
		content = <AutocompleteItemLoading preview />;
	}
	if (item.type === '/preview') {
		content =
			item.preview.type === 'image' ? (
				<FastImage
					style={{ height: 80, minWidth: 80, borderRadius: 4 }}
					source={{ uri: item.preview.value }}
					resizeMode={FastImage.resizeMode.cover}
				/>
			) : (
				<CustomIcon name='attach' size={36} color={colors.actionTintColor} />
			);
	}

	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
		>
			{content}
		</RectButton>
	);
};
