import React, { useContext } from 'react';
import { View } from 'react-native';

import Markdown from '../../../../markdown';
import { useMediaAutoDownload } from '../../../hooks/useMediaAutoDownload';
import { Button } from './Button';
import { MessageImage } from './Image';
import AltTextLabel from './AltTextLabel';
import { type IImageContainer } from './definitions';
import MessageContext from '../../../Context';
import { WidthAwareView } from '../../WidthAwareView';

const ImageContainer = ({
	file,
	showAttachment,
	getCustomEmoji,
	author,
	msg,
	imagePreview,
	imageType,
	isAltTextSupported = false
}: IImageContainer): React.ReactElement | null => {
	'use memo';

	const { user } = useContext(MessageContext);
	const { status, onPress, url, isEncrypted } = useMediaAutoDownload({ file, author, showAttachment });

	const image = (
		<Button onPress={onPress}>
			<WidthAwareView>
				<MessageImage
					uri={url}
					status={status}
					encrypted={isEncrypted}
					imagePreview={imagePreview}
					imageType={imageType}
					altText={isAltTextSupported ? msg : undefined}
				/>
			</WidthAwareView>
		</Button>
	);

	// server >= 8.4: description is alt text — show pill label below the image
	if (isAltTextSupported && msg) {
		return (
			<View style={{ gap: 4 }}>
				{image}
				<AltTextLabel />
			</View>
		);
	}

	// server < 8.4: description is a caption — render as Markdown above the image
	if (msg) {
		return (
			<View style={{ gap: 4 }}>
				<Markdown msg={msg} username={user.username} getCustomEmoji={getCustomEmoji} />
				{image}
			</View>
		);
	}

	return image;
};

ImageContainer.displayName = 'MessageImageContainer';

export default ImageContainer;
