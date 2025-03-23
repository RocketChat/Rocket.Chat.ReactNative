import React, { useEffect, useState } from 'react';
import { Dimensions, Image as RNImage } from 'react-native';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import { Image as ExpoImage } from 'expo-image';

import { TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../styles';

interface IImageProps {
	value: ImageProps['value'];
}

type TMarkdownImage = {
	img: string;
	theme: TSupportedThemes;
};

const ImageProgress = createImageProgress(ExpoImage);

const { width: screenWidth } = Dimensions.get('window');

const MarkdownImage = ({ img, theme }: TMarkdownImage) => {
	const [imageSize, setImageSize] = useState({ width: 100, height: 100 });

	useEffect(() => {
		RNImage.getSize(img, (width, height) => {
			// Scale the image to fit within the screen width
			const maxWidth = screenWidth * 0.9; // Max width is 90% of screen
			const scaleFactor = maxWidth / width;
			const newHeight = height * scaleFactor;

			setImageSize({ width: maxWidth, height: newHeight });
		});
	}, [img]);

	return (
		<ImageProgress
			style={[styles.inlineImage, { width: imageSize.width, height: imageSize.height, borderColor: themes[theme].strokeLight }]}
			source={{ uri: encodeURI(img) }}
			indicator={Progress.Pie}
			indicatorProps={{ color: themes[theme].fontHint }}
			contentFit='contain'
		/>
	);
};

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MarkdownImage img={src.value} theme={theme} />;
};

export default Image;
