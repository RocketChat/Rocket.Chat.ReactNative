import React, { memo } from 'react';
import { type Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IImageProps {
	value: ImageProps['value'];
}

const Image = memo(({ value }: IImageProps) => {
    'use memo';
    
	const { colors } = useTheme();
	const { src } = value;

	return (
		<ExpoImage
			style={[styles.inlineImage, { borderColor: colors.strokeLight }]}
			source={{ uri: encodeURI(src.value) }}
			contentFit='contain'
		/>
	);
});

export default Image;
