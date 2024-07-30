import React, { useContext, useEffect, useState } from 'react';
import { View, ViewStyle, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

import { isValidUrl } from '../../../../../lib/methods/helpers/isValidUrl';
import { useTheme } from '../../../../../theme';
import styles from '../../../styles';
import OverlayComponent from '../../OverlayComponent';
import { IMessageImage } from './definitions';
import { WidthAwareContext } from '../../WidthAwareView';

export const MessageImage = React.memo(({ uri, status, encrypted = false }: IMessageImage) => {
	const { colors } = useTheme();
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const maxSize = useContext(WidthAwareContext);
	const showImage = isValidUrl(uri) && status === 'downloaded';

	useEffect(() => {
		if (showImage) {
			Image.getSize(uri, (width, height) => {
				setImageDimensions({ width, height });
			});
		}
	}, [uri, showImage]);

	const width = Math.min(imageDimensions.width, maxSize) || 0;
	const height = Math.min((imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100, maxSize) || 0;
	const imageStyle = {
		width,
		height
	};

	const containerStyle: ViewStyle = {
		borderColor: colors.strokeLight,
		borderWidth: 1,
		borderRadius: 4,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		...(imageDimensions.width <= 64 && { width: 64 }),
		...(imageDimensions.height <= 64 && { height: 64 })
	};

	if (encrypted && status === 'downloaded') {
		return (
			<>
				<View style={styles.image} />
				<OverlayComponent loading={false} style={[styles.image, styles.imageBlurContainer]} iconName='encrypted' />
			</>
		);
	}

	return (
		<>
			{showImage ? (
				<View style={containerStyle}>
					<FastImage
						style={[imageStyle, { borderColor: colors.strokeLight }]}
						source={{ uri: encodeURI(uri) }}
						resizeMode={FastImage.resizeMode.cover}
					/>
				</View>
			) : (
				<View style={styles.image} />
			)}
			{['loading', 'to-download'].includes(status) ? (
				<OverlayComponent
					loading={status === 'loading'}
					style={[styles.image, styles.imageBlurContainer]}
					iconName='arrow-down-circle'
				/>
			) : null}
		</>
	);
});

MessageImage.displayName = 'MessageImage';
