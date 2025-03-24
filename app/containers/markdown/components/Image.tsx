import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, Image as RNImage, View } from 'react-native';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import { Image as ExpoImage } from 'expo-image';

import { TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../styles';
import { WidthAwareContext } from '.././../message/Components/WidthAwareView';

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
	const maxSize = useContext(WidthAwareContext);

	useEffect(() => {
		RNImage.getSize(img, (width, height) => {
			const widthVal = Math.min(width, maxSize) || 0;
			const heightVal = Math.min((height * ((width * 100) / width)) / 100, maxSize) || 0;
			setImageSize({ width: widthVal, height: heightVal });
		});
	}, [img]);

	return (
		<View
			style={{
				width: imageSize.width,
				height: imageSize.height,
				flex: 1
			}}>
			<ImageProgress
				style={[styles.inlineImage, { width: '100%', height: '100%', borderColor: themes[theme].strokeLight }]}
				source={{ uri: encodeURI(img) }}
				indicator={Progress.Pie}
				indicatorProps={{ color: themes[theme].fontHint }}
				contentFit='contain'
			/>
		</View>
	);
};

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MarkdownImage img={src.value} theme={theme} />;
};

export default Image;
