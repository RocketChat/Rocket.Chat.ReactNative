import React from 'react';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from '@rocket.chat/react-native-fast-image';

import { TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../../message/styles';

interface IImageProps {
	value: ImageProps['value'];
}

type TMessageImage = {
	img: string;
	theme: TSupportedThemes;
};

const ImageProgress = createImageProgress(FastImage);

const MessageImage = ({ img, theme }: TMessageImage) => (
	<ImageProgress
		style={[styles.inlineImage, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
		indicator={Progress.Pie}
		indicatorProps={{
			color: themes[theme].actionTintColor
		}}
	/>
);

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MessageImage img={src.value} theme={theme} />;
};

export default Image;
