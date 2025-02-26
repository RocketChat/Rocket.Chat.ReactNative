import React from 'react';
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

const MarkdownImage = ({ img, theme }: TMarkdownImage) => (
	<ImageProgress
		style={[styles.inlineImage, { borderColor: themes[theme].strokeLight }]}
		source={{ uri: encodeURI(img) }}
		indicator={Progress.Pie}
		indicatorProps={{
			color: themes[theme].fontHint
		}}
		contentFit='contain'
	/>
);

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MarkdownImage img={src.value} theme={theme} />;
};

export default Image;
