import React from 'react';
import { Image as ImageProps } from '@rocket.chat/message-parser';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-fast-image';

import { useTheme } from '../../../theme';
import styles from '../../message/styles';

const ImageProgress = createImageProgress(FastImage);

const MessageImage = ({ img }: { img: string }) => {
	const { colors } = useTheme();
	return (
		<ImageProgress
			style={[styles.inlineImage, { borderColor: colors.borderColor }]}
			source={{ uri: encodeURI(img) }}
			resizeMode={FastImage.resizeMode.cover}
			indicator={Progress.Pie}
			indicatorProps={{
				color: colors.actionTintColor
			}}
		/>
	);
};

const Image = ({ value }: { value: ImageProps['value'] }) => {
	const { src } = value;

	return <MessageImage img={src.value} />;
};

export default Image;
