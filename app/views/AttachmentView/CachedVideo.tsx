import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface CachedVideoProps {
	videoUrl: string;
	fallbackOnError?: () => void;
	style?: StyleProp<ViewStyle>;
	resizeMode?: ResizeMode;
	shouldPlay?: boolean;
	isLooping?: boolean;
	setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
	useNativeControls?: boolean;
	loading?: boolean;
}

const CachedVideo: React.FC<CachedVideoProps> = ({
	videoUrl,
	fallbackOnError = () => {},
	style,
	resizeMode = ResizeMode.CONTAIN,
	shouldPlay = true,
	isLooping = false,
	useNativeControls = true,
	setLoading = () => {},
	loading = false,
	...props
}) => {
	const [localUri, setLocalUri] = useState<string | null>(null);
	const videoRef = useRef<Video>(null);

	useEffect(() => {
		const cacheVideo = async () => {
			try {
				const fileName = videoUrl.split('/').pop() || `cached-video-${Date.now()}.mp4`;
				const localPath = FileSystem.documentDirectory + fileName;
				const fileInfo = await FileSystem.getInfoAsync(localPath);

				if (!fileInfo.exists) {
					await FileSystem.downloadAsync(videoUrl, localPath);
				}

				setLocalUri(localPath);
			} catch (error) {
				console.error('Video caching error:', error);
				fallbackOnError();
			} finally {
				setLoading(false);
			}
		};

		cacheVideo();
	}, [videoUrl]);

	if (loading) {
		return (
			<View style={[styles.loadingContainer, style]}>
				<ActivityIndicator size='large' />
			</View>
		);
	}

	return (
		<Video
			ref={videoRef}
			source={{ uri: localUri! }}
			rate={1.0}
			volume={1.0}
			isMuted={false}
			onLoad={() => setLoading(false)}
			onError={fallbackOnError}
			resizeMode={resizeMode}
			shouldPlay={shouldPlay}
			isLooping={isLooping}
			useNativeControls={useNativeControls}
			style={style}
			{...props}
		/>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000',
		flex: 1
	}
});

export default CachedVideo;
