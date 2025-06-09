import React, { useContext } from 'react';
import { View } from 'react-native';

import Markdown from '../../../../markdown';
import { useMediaAutoDownload } from '../../../hooks/useMediaAutoDownload';
import { Button } from './Button';
import { MessageImage } from './Image';
import { IImageContainer } from './definitions';
import MessageContext from '../../../Context';
import { WidthAwareView } from '../../WidthAwareView';

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
	/* const [isPlaying, setIsPlaying] = useState<boolean>(!!autoplayGifs);

	const handleGifPlayback = async () => {
		if (isPlaying) {
			setIsPlaying(false);
			await expoImageRef.current?.stopAnimating();
			return;
		}
		setIsPlaying(true);
		await expoImageRef.current?.startAnimating();
	}; */
	const { status, onPress, url, isEncrypted } = useMediaAutoDownload({ file, author, showAttachment });

	const image = (
		<Button onPress={onPress}>
			<WidthAwareView>
				<MessageImage uri={url} status={status} encrypted={isEncrypted} imagePreview={imagePreview} imageType={imageType} />
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
