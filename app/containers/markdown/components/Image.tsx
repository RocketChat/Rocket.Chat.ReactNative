import { type Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { useTheme } from '~/theme';
import styles from '../styles';
import { useMarkdownContext } from '../contexts/MarkdownContext';

interface IImageProps {
	value: ImageProps['value'];
}

const Image = ({ value }: IImageProps) => {
	const { colors } = useTheme();
	const { imageSize } = useMarkdownContext();
	const { src } = value;

	return (
		<ExpoImage
			style={[
				styles.inlineImage,
				imageSize ? { width: imageSize, height: imageSize } : undefined,
				{ borderColor: colors.strokeLight }
			]}
			source={{ uri: encodeURI(src.value) }}
			contentFit='contain'
		/>
	);
};

export default Image;
