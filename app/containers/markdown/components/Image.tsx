import React, { useState } from 'react';
import type { Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { type TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../styles';

interface IImageProps {
	value: ImageProps['value'];
}

type TMarkdownImage = {
	img: string;
	theme: TSupportedThemes;
};

const MarkdownImage = ({ img, theme }: TMarkdownImage) => {
	const [size, setSize] = useState(styles.inlineImage);

	return <ExpoImage
		style={[size, { overflow: "visible", borderColor: themes[theme].strokeLight }]}
		contentFit='contain'
		contentPosition={{
			left: 0,
			bottom: size.height/2
		}}
		source={{ uri: encodeURI(img) }}
		onLoad={({ source }) => {
			const { width, height } = source;
			if (width && height) {
				setSize({ width, height });
			}
		}}
	/>
};

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MarkdownImage img={src.value} theme={theme} />;
};

export default Image;
