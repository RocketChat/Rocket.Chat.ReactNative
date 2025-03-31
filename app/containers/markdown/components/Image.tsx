import React, { useState } from 'react';
import type { Image as ImageProps } from '@rocket.chat/message-parser';
import { Image } from 'expo-image';

import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import styles from '../styles';

interface IImageProps {
	value: ImageProps['value'];
	onHeightChange?: (height: number) => void;
}

const MarkdownImage = ({ value, onHeightChange }: IImageProps) => {
	const { theme } = useTheme();
	const [size, setSize] = useState({ width: styles.inlineImage.width, height: styles.inlineImage.height });

	return (
		<Image
			style={[size, { borderColor: themes[theme].strokeLight }]}
			contentFit='contain'
			source={encodeURI(value.src.value)}
			onLoad={({ source }) => {
				setSize({
					width: source.width,
					height: source.height
				});
				if (onHeightChange) {
					onHeightChange(source.height);
				}
			}}
		/>
	);
};

export default MarkdownImage;
