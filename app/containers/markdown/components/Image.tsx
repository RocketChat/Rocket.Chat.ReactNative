import React from 'react';
import type { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-blasted-image';

import { type TSupportedThemes, useTheme } from '../../../theme';
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
		style={[styles.inlineImage, { borderColor: themes[theme].strokeLight }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={'cover'}
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
