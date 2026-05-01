import React, { useState } from 'react';
import { type Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage, type ImageLoadEventData } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IImageProps {
	value: ImageProps['value'];
}

const MAX_HEIGHT = 300;

const Image = ({ value }: IImageProps) => {
	const { colors } = useTheme();
	const { src } = value;
	const [aspectRatio, setAspectRatio] = useState<number>(1);

	const onLoad = (event: ImageLoadEventData) => {
		const { height, width } = event.source;
		if (width && height) {
			setAspectRatio(width / height);
		}
	};

	return (
		<View>
			<ExpoImage
				style={[styles.inlineImage, { borderColor: colors.strokeLight, aspectRatio, maxHeight: MAX_HEIGHT }]}
				source={{ uri: encodeURI(src.value) }}
				contentFit='contain'
				onLoad={onLoad}
			/>
		</View>
	);
};

export default Image;
