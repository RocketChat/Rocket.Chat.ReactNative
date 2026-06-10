import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { isTablet } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { CustomIcon } from '../../containers/CustomIcon';

const SIZE = 96;
const MARGIN_TOP = isTablet ? 0 : 64;
const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
		width: '100%',
		height: SIZE + MARGIN_TOP,
		justifyContent: 'flex-end',
		alignItems: 'center'
	},
	image: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS
	},
	imageContainer: {
		width: SIZE,
		height: SIZE,
		position: 'relative'
	},
	skeletonOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	fallbackContainer: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

interface IServerAvatar {
	url: string;
	image: string;
}

const ServerAvatar = React.memo(({ url, image }: IServerAvatar) => {
	const { colors, theme } = useTheme();
	const isDarkMode = theme === 'dark' || theme === 'black';
	
	const imageUri = image ? `${url}/${image}` : null;
	
	// Track loading and error states
	const [loading, setLoading] = useState(() => !!imageUri);
	const [error, setError] = useState(false);

	// Reset states when image changes
	React.useEffect(() => {
		if (imageUri) {
			setLoading(true);
			setError(false);
		} else {
			setLoading(false);
			setError(false);
		}
	}, [imageUri]);

	const handleLoadStart = () => {
		setLoading(true);
		setError(false);
	};

	const handleLoad = () => {
		setLoading(false);
		setError(false);
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	// Show fallback icon on error or when no image is provided
	if (error || !imageUri) {
		return (
			<View style={styles.container}>
				<View
					style={[
						styles.fallbackContainer,
						{
							backgroundColor: isDarkMode ? colors.surfaceNeutral : 'transparent',
							borderColor: colors.strokeLight,
							borderWidth: 1
						}
					]}>
					<CustomIcon name='workspaces' size={SIZE * 0.5} color={colors.fontSecondaryInfo} />
				</View>
			</View>
		);
	}

	// Show the actual image with an overlaid skeleton while loading
	return (
		<View style={styles.container}>
			<View style={styles.imageContainer}>
				<Image
					style={[
						styles.image,
						{
							borderColor: colors.strokeLight,
							borderWidth: 1,
							backgroundColor: isDarkMode ? colors.surfaceNeutral : 'transparent'
						}
					]}
					source={{ uri: imageUri }}
					onLoadStart={handleLoadStart}
					onLoad={handleLoad}
					onError={handleError}
					contentFit='cover'
				/>
				{loading && (
					<View style={styles.skeletonOverlay}>
						<SkeletonPlaceholder borderRadius={BORDER_RADIUS} backgroundColor={colors.surfaceNeutral}>
							<SkeletonPlaceholder.Item width={SIZE} height={SIZE} borderRadius={BORDER_RADIUS} />
						</SkeletonPlaceholder>
					</View>
				)}
			</View>
		</View>
	);
});

export default ServerAvatar;
