import React from 'react';
import { type Image as ImageProps } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import { useTheme } from '../../../theme';
import styles from '../styles';
import Skeleton from '../../Skeleton/Skeleton';

interface IImageProps {
	value: ImageProps['value'];
}

const Image = ({ value }: IImageProps) => {
	const { colors } = useTheme();
	const { src } = value;
	const [loading, setLoading] = React.useState(true);

	return (
		<>
			{loading ? <Skeleton width={100} height={100} borderRadius={4} /> : null}
			<ExpoImage
				style={[styles.inlineImage, { borderColor: colors.strokeLight }, loading && { width: 0, height: 0 }]}
				source={{ uri: encodeURI(src.value) }}
				contentFit='contain'
				onLoadEnd={() => setLoading(false)}
			/>
		</>
	);
};

export default Image;
