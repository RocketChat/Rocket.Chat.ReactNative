import React, { useContext, useEffect, useState } from 'react';
import { View, ViewStyle, Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

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
	const showImage = isValidUrl(uri) && imageDimensions.width && status === 'downloaded';

	useEffect(() => {
		if (status === 'downloaded') {
			Image.getSize(uri, (width, height) => {
				setImageDimensions({ width, height });
			});
		}
	}, [uri, status]);

	const width = Math.min(imageDimensions.width, maxSize) || 0;
	const height = Math.min((imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100, maxSize) || 0;
	const imageStyle = {
		width,
		height
	};

	const containerStyle: ViewStyle = {
		alignItems: 'center',
		justifyContent: 'center',
		...(imageDimensions.width <= 64 && { width: 64 }),
		...(imageDimensions.height <= 64 && { height: 64 })
	};

	const borderStyle: ViewStyle = {
		borderColor: colors.strokeLight,
		borderWidth: 1,
		borderRadius: 4,
		overflow: 'hidden'
	};

	if (encrypted && status === 'downloaded') {
		return (
			<>
				<View style={styles.image} />
				<OverlayComponent loading={false} style={styles.image} iconName='encrypted' />
			</>
		);
	}

	return (
		<>
			{showImage ? (
				<View style={[containerStyle, borderStyle]}>
					<ExpoImage style={imageStyle} source={{ uri: encodeURI(uri) }} contentFit='cover' />
				</View>
			) : (
				<View style={[styles.image, borderStyle]} />
			)}
			{['loading', 'to-download'].includes(status) || (status === 'downloaded' && !showImage) ? (
				<OverlayComponent
					loading={['loading', 'downloaded'].includes(status)}
					style={[styles.image, borderStyle]}
					iconName='arrow-down-circle'
				/>
			) : null}
		</>
	);
});

MessageImage.displayName = 'MessageImage';
