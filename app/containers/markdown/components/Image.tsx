import { type Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { useTheme } from '~/theme';
import { useMarkdownContext } from '../contexts/MarkdownContext';

const INLINE_IMAGE_SIZE = 300;

interface IImageProps {
	value: ImageProps['value'];
}

const Image = ({ value }: IImageProps) => {
	const { colors } = useTheme();
	const { imageSize = INLINE_IMAGE_SIZE } = useMarkdownContext();
	const { src } = value;

	return (
		<ExpoImage
			style={{ width: imageSize, height: imageSize, borderColor: colors.strokeLight }}
			source={{ uri: encodeURI(src.value) }}
			contentFit='contain'
		/>
	);
};

export default Image;
