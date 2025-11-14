import React, { useEffect, useMemo, useRef, useState } from 'react';
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
		const separator = baseUri.includes('?') ? '&' : '?';
		return `${baseUri}${separator}_cb=${encodeURIComponent(image)}`;
	}, [url, image]);
	
	// Track loading/error for the current imageUri and reset when it changes
	const previousImageUriRef = useRef<string | null>(imageUri);
	const [loading, setLoading] = useState(() => !!imageUri);
	const [error, setError] = useState(false);

	// Reset loading/error state when imageUri changes
	// This ensures a new image URL can recover from previous errors
	// Note: Using useEffect here is necessary to reset state when props change.
	// The linter warning about cascading renders is acceptable here as we need
	// to synchronize component state with prop changes for proper error recovery.
	useEffect(() => {
		// Only update if imageUri actually changed
		if (previousImageUriRef.current !== imageUri) {
			previousImageUriRef.current = imageUri;
			if (imageUri) {
				// New image: start in loading state and clear previous errors
				setLoading(true);
				setError(false);
			} else {
				// No image: nothing to load, no error
				setLoading(false);
				setError(false);
			}
		}
	}, [imageUri]);

	const handleLoad = () => {
		setLoading(false);
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	const showFallback = error || !imageUri;

	// Show fallback icon on error or when no image is provided
	if (showFallback) {
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
