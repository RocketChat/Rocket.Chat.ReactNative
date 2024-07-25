import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { isValidUrl } from '../../../../../lib/methods/helpers/isValidUrl';
import { useTheme } from '../../../../../theme';
import styles from '../../../styles';
import OverlayComponent from '../../OverlayComponent';
import { IMessageImage } from './definitions';

export const MessageImage = React.memo(({ uri, status, encrypted = false }: IMessageImage) => {
	const { colors } = useTheme();
	const valid = isValidUrl(uri);

	if (encrypted && status === 'cached') {
		return (
			<>
				<View style={styles.image} />
				<OverlayComponent loading={false} style={[styles.image, styles.imageBlurContainer]} iconName='encrypted' />
			</>
		);
	}

	return (
		<>
			{valid ? (
				<FastImage
					style={[styles.image, { borderColor: colors.strokeLight }]}
					source={{ uri: encodeURI(uri) }}
					resizeMode={FastImage.resizeMode.cover}
				/>
			) : (
				<View style={styles.image} />
			)}
			{status === 'loading' ? (
				<OverlayComponent loading style={[styles.image, styles.imageBlurContainer]} iconName='arrow-down-circle' />
			) : null}
		</>
	);
});

MessageImage.displayName = 'MessageImage';
