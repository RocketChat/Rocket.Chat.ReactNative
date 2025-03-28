import React from 'react';
import type { Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { type TSupportedThemes, useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';

interface IImageProps {
	value: ImageProps['value'];
}

type TMarkdownImage = {
	img: string;
	theme: TSupportedThemes;
};

const MarkdownImage = ({ img, theme }: TMarkdownImage) => (
	<ExpoImage
		style={[{ flex: 1, overflow: "visible", borderColor: themes[theme].strokeLight }]}
		source={{ uri: encodeURI(img) }}
		contentFit='cover'
		contentPosition={{
			bottom: 0,
			left: 0
		}}
		transition={100}
	/>
);

const Image = ({ value }: IImageProps) => {
	const { theme } = useTheme();
	const { src } = value;

	return <MarkdownImage img={src.value} theme={theme} />;
};

export default Image;
