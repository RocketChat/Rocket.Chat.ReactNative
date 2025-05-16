import React, { useEffect, useState, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';

import { downloadMediaFile, getMediaCache } from '../../lib/methods/handleMediaDownload';

interface VideoProps {
	videoUrl: string;
	fallbackOnError?: () => void;
	style?: StyleProp<ViewStyle>;
	resizeMode?: ResizeMode;
	shouldPlay?: boolean;
	isLooping?: boolean;
	setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
	useNativeControls?: boolean;
}

const Video: React.FC<VideoProps> = ({
	videoUrl,
	fallbackOnError = () => {},
	style,
	resizeMode = ResizeMode.CONTAIN,
	shouldPlay = true,
	isLooping = false,
	useNativeControls = true,
	setLoading = () => {},
	...props
}) => {
	const [localUri, setLocalUri] = useState<string | null>(null);
	const videoRef = useRef<ExpoVideo>(null);

	useEffect(() => {
		const handleCache = async () => {
			setLoading(true);

			try {
				const cache = await getMediaCache({ type: 'video' as const, mimeType: 'video/mp4', urlToCache: videoUrl });
				const option = {
					messageId: videoUrl,
					type: 'video' as const,
					mimeType: 'video/mp4',
					downloadUrl: videoUrl
				};
				if (cache?.exists) {
					setLocalUri(cache.uri);
					return;
				}
				const uri = await downloadMediaFile(option);

				setLocalUri(uri);
			} catch (error) {
				fallbackOnError();
			} finally {
				setLoading(false);
			}
		};

		handleCache();
	}, [videoUrl]);

	return (
		<ExpoVideo
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

export default Video;
