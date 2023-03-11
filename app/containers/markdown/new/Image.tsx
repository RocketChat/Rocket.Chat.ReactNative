import React from 'react';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import FastImage from 'react-native-fast-image';

import { TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../../message/styles';
import ImageWithSkeleton from '../../ImageWithSkeleton';

interface IImageProps {
	value: ImageProps['value'];
}

type TMessageImage = {
	img: string;
	theme: TSupportedThemes;
};

const MessageImage = ({ img, theme }: TMessageImage) => (
	<ImageWithSkeleton
		style={[styles.inlineImage, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
	/>
);

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MessageImage img={src.value} theme={theme} />;
};

export default Image;
