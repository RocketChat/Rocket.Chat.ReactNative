import React from 'react';
import { RectButton } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';

import { IAutocompleteItemProps } from '../../interfaces';
import { CustomIcon } from '../../../CustomIcon';
import { AutocompleteItemLoading } from './AutocompleteItemLoading';
import { useStyle } from './styles';

export const AutocompletePreview = ({ item, onPress }: IAutocompleteItemProps) => {
	const [styles, colors] = useStyle();

	let content;
	if (item.type === 'loading') {
		content = <AutocompleteItemLoading preview />;
	}
	if (item.type === '/preview') {
		content =
			item.preview.type === 'image' ? (
				<FastImage style={styles.previewImage} source={{ uri: item.preview.value }} resizeMode={FastImage.resizeMode.cover} />
			) : (
				<CustomIcon name='attach' size={36} />
			);
	}

	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={styles.previewItem}
			rippleColor={colors.buttonBackgroundPrimaryPress}>
			{content}
		</RectButton>
	);
};
