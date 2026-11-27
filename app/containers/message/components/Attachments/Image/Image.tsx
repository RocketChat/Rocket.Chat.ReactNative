import { useContext } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

import { isValidUrl } from '~/lib/methods/helpers/isValidUrl';
import { useTheme } from '~/theme';
import styles from '~/containers/message/styles';
import OverlayComponent from '~/containers/message/components/OverlayComponent';
import { type IMessageImage } from './definitions';
import { WidthAwareContext } from '~/containers/message/components/WidthAwareView';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { AUTOPLAY_GIFS_PREFERENCES_KEY } from '~/lib/constants/keys';
import ImageBadge from './ImageBadge';
import { encodeAttachmentUrl } from '~/lib/methods/helpers/formatAttachmentUrl';
import { mediaSharedTransition } from '~/lib/animations/mediaSharedTransition';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const FRAME_BORDER_WIDTH = 1;
const FRAME_BORDER_RADIUS = 4;
const imageCorners = { borderRadius: FRAME_BORDER_RADIUS - FRAME_BORDER_WIDTH };

export const MessageImage = ({
	uri,
	status,
	encrypted = false,
	imagePreview,
	imageType,
	imageSize,
	sharedTransitionTag
}: IMessageImage) => {
	const { colors } = useTheme();
	const [autoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY, true);
	const maxSize = useContext(WidthAwareContext);
	const showImage = isValidUrl(uri) && imageSize.width && status === 'downloaded';
	const isGif = imageType === 'image/gif';

	const width = Math.min(imageSize.width, maxSize) || 0;
	const height = Math.min((imageSize.height * ((width * 100) / imageSize.width)) / 100, maxSize) || 0;
	const imageStyle = {
		width,
		height
	};

	const containerStyle: ViewStyle = {
		alignItems: 'center',
		justifyContent: 'center',
		...(imageSize.width <= 64 && { width: 64 }),
		...(imageSize.height <= 64 && { height: 64 })
	};

	const frameStyle: ViewStyle = {
		borderColor: colors.strokeLight,
		borderWidth: FRAME_BORDER_WIDTH,
		borderRadius: FRAME_BORDER_RADIUS
	};

	const borderStyle: ViewStyle = {
		...frameStyle,
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
				<View style={[containerStyle, frameStyle]}>
					<AnimatedImage
						autoplay={autoplayGifs}
						style={[imageStyle, imageCorners]}
						source={{ uri: encodeAttachmentUrl(uri) }}
						contentFit='cover'
						sharedTransitionTag={sharedTransitionTag}
						sharedTransitionStyle={mediaSharedTransition}
					/>
				</View>
			) : null}
			{['loading', 'to-download'].includes(status) || (status === 'downloaded' && !showImage) ? (
				<>
					{imagePreview && imageType && !encrypted ? (
						<Image
							autoplay={autoplayGifs}
							style={styles.image}
							source={{ uri: `data:${imageType};base64,${imagePreview}` }}
							contentFit='cover'
						/>
					) : (
						<View style={[styles.image, borderStyle]} />
					)}
					<OverlayComponent
						loading={['loading', 'downloaded'].includes(status)}
						style={[styles.image, borderStyle]}
						iconName={status === 'to-download' ? 'arrow-down-circle' : 'loading'}
						showBackground={!imagePreview || !imageType}
					/>
				</>
			) : null}
			<View style={styles.badgeContainer}>{isGif ? <ImageBadge title='GIF' /> : null}</View>
		</>
	);
};
