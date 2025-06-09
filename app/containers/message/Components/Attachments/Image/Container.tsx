import React, { useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import Markdown from '../../../../markdown';
import { useMediaAutoDownload } from '../../../hooks/useMediaAutoDownload';
import { Button } from './Button';
import { MessageImage } from './Image';
import { IImageContainer } from './definitions';
import MessageContext from '../../../Context';
import { WidthAwareView } from '../../WidthAwareView';
import { useUserPreferences } from '../../../../../lib/methods';
import { AUTOPLAY_GIFS_PREFERENCES_KEY } from '../../../../../lib/constants';

const ImageContainer = ({
	file,
	showAttachment,
	getCustomEmoji,
	style,
	isReply,
	author,
	msg,
	imagePreview,
	imageType
}: IImageContainer): React.ReactElement | null => {
	const { user } = useContext(MessageContext);
	const isGif = file.image_type === 'image/gif';
	const [autoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY);
	const [isPlaying, setIsPlaying] = useState<boolean>(!!autoplayGifs);
	const expoImageRef = useRef<ExpoImage>(null);

	const handleGifPlayback = async () => {
		if (isPlaying) {
			setIsPlaying(false);
			await expoImageRef.current?.stopAnimating();
			return;
		}
		setIsPlaying(true);
		await expoImageRef.current?.startAnimating();
	};
	const { status, onPress, url, isEncrypted } = useMediaAutoDownload({ file, isGif, author, showAttachment, handleGifPlayback });

	const image = (
		<Button onPress={onPress}>
			<WidthAwareView>
				<MessageImage
					uri={url}
					status={status}
					encrypted={isEncrypted}
					imagePreview={imagePreview}
					isGif={isGif}
					imageType={imageType}
					autoplayGifs={autoplayGifs}
					expoImageRef={expoImageRef}
				/>
			</WidthAwareView>
		</Button>
	);

	if (msg) {
		return (
			<View>
				<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} />
				{image}
			</View>
		);
	}

	return image;
};

ImageContainer.displayName = 'MessageImageContainer';

export default ImageContainer;
