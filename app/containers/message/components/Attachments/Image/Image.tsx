import { useContext, useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { isValidUrl } from '~/lib/methods/helpers/isValidUrl';
import { useTheme } from '~/theme';
import styles from '~/containers/message/styles';
import OverlayComponent from '~/containers/message/components/OverlayComponent';
import { type IMessageImage } from './definitions';
import { WidthAwareContext } from '~/containers/message/components/WidthAwareView';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { AUTOPLAY_GIFS_PREFERENCES_KEY } from '~/lib/constants/keys';
import ImageBadge from './ImageBadge';
import log from '~/lib/methods/helpers/log';
import { encodeAttachmentUrl } from '~/lib/methods/helpers/formatAttachmentUrl';

const BORDER_WIDTH = 1;

const fitInto = ({ width: naturalWidth, height: naturalHeight }: { width: number; height: number }, maxSize: number) => {
	const width = Math.min(naturalWidth, maxSize) || 0;
	const height = Math.min((naturalHeight * ((width * 100) / naturalWidth)) / 100, maxSize) || 0;
	return { width, height };
};

export const MessageImage = ({ uri, status, encrypted = false, imagePreview, imageType, dimensions }: IMessageImage) => {
	const { colors } = useTheme();
	const [imageDimensions, setImageDimensions] = useState({
		width: 0,
		height: 0
	});
	const [autoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY, true);
	const maxSize = useContext(WidthAwareContext);
	const showImage = isValidUrl(uri) && imageDimensions.width && status === 'downloaded';
	const isGif = imageType === 'image/gif';

	useEffect(() => {
		if (status === 'downloaded') {
			Image.loadAsync(uri, {
				onError: e => {
					log(e);
				},
				maxHeight: 1000,
				maxWidth: 1000
			}).then(image => {
				setImageDimensions({ width: image.width, height: image.height });
			});
		}
	}, [uri, status]);

	const imageStyle = fitInto(imageDimensions, maxSize);
	const knownDimensions =
		dimensions?.width && dimensions?.height && maxSize ? { width: dimensions.width, height: dimensions.height } : undefined;
	const placeholderStyle = knownDimensions
		? [
				styles.image,
				{
					minHeight: 0,
					height: fitInto(knownDimensions, maxSize).height + 2 * BORDER_WIDTH
				}
			]
		: styles.image;

	const containerStyle: ViewStyle = {
		alignItems: 'center',
		justifyContent: 'center',
		...(imageDimensions.width <= 64 && { width: 64 }),
		...(imageDimensions.height <= 64 && { height: 64 })
	};

	const borderStyle: ViewStyle = {
		borderColor: colors.strokeLight,
		borderWidth: BORDER_WIDTH,
		borderRadius: 4,
		overflow: 'hidden'
	};

	if (encrypted && status === 'downloaded') {
		return (
			<>
				<View style={styles.image} />
				<OverlayComponent loading={false} style={styles.image} iconName='encrypted' showBackground={true} />
			</>
		);
	}

	return (
		<>
			{showImage ? (
				<View style={[containerStyle, borderStyle]}>
					<Image autoplay={autoplayGifs} style={imageStyle} source={{ uri: encodeAttachmentUrl(uri) }} contentFit='cover' />
				</View>
			) : null}
			{['loading', 'to-download'].includes(status) || (status === 'downloaded' && !showImage) ? (
				<>
					{imagePreview && imageType && !encrypted ? (
						<Image
							autoplay={autoplayGifs}
							style={placeholderStyle}
							source={{ uri: `data:${imageType};base64,${imagePreview}` }}
							contentFit='cover'
						/>
					) : (
						<View style={[placeholderStyle, borderStyle]} />
					)}
					<OverlayComponent
						loading={['loading', 'downloaded'].includes(status)}
						style={[placeholderStyle, borderStyle]}
						iconName={status === 'to-download' ? 'arrow-down-circle' : 'loading'}
						showBackground={!imagePreview || !imageType}
					/>
				</>
			) : null}
			<View style={styles.badgeContainer}>{isGif ? <ImageBadge title='GIF' /> : null}</View>
		</>
	);
};
