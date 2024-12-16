import React from 'react';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import { Image as ExpoImage } from 'expo-image';

import { TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../../message/styles';
import { ImagePriority } from '../../../definitions';

interface IImageProps {
	value: ImageProps['value'];
}

type TMessageImage = {
	img: string;
	theme: TSupportedThemes;
};

const ImageProgress = createImageProgress(ExpoImage);

const MessageImage = ({ img, theme }: TMessageImage) => (
	<ImageProgress
		style={[styles.inlineImage, { borderColor: themes[theme].strokeLight }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={ImagePriority.high}
		indicator={Progress.Pie}
		indicatorProps={{
			color: themes[theme].fontHint
		}}
	/>
);

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MessageImage img={src.value} theme={theme} />;
};

export default Image;
