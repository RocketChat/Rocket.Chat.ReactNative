import React, { useMemo, useState } from 'react';
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
	
	// Add cache busting parameter to prevent showing stale cached images
	// Use image value as cache key - when image changes, URL changes and cache is invalidated
	const imageUri = useMemo(() => {
		if (!image) return null;
		const baseUri = `${url}/${image}`;
		// Add cache busting query parameter using image value hash
		// This ensures cache invalidation when image changes without using Date.now()
		const separator = image.includes('?') ? '&' : '?';
		return `${baseUri}${separator}_cb=${encodeURIComponent(image)}`;
	}, [url, image]);
	
	// Initialize loading state - will be reset by onLoadStart when Image mounts
	const [loading, setLoading] = useState(() => !!imageUri);
	const [error, setError] = useState(false);

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

	// Show skeleton while loading
	if (loading && imageUri && !error) {
		return (
			<View style={styles.container}>
				<SkeletonPlaceholder borderRadius={BORDER_RADIUS} backgroundColor={colors.surfaceNeutral}>
					<SkeletonPlaceholder.Item width={SIZE} height={SIZE} borderRadius={BORDER_RADIUS} />
				</SkeletonPlaceholder>
			</View>
		);
	}

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

	// Show the actual image
	return (
		<View style={styles.container}>
			<Image
				key={`${imageUri}-${image}`}
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
		</View>
	);
});

export default ServerAvatar;
