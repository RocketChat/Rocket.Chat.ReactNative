import { type ReactElement } from 'react';
import { View } from 'react-native';

import Markdown from '../../../../markdown';
import { useMediaAutoDownload } from '../../../hooks/useMediaAutoDownload';
import { Button } from './Button';
import { MessageImage } from './Image';
import AltTextLabel from '../../../../AltTextLabel';
import { type IImageContainer } from './definitions';
import { useMessageUser } from '../../../MessageRoomStore';
import { WidthAwareView } from '../../WidthAwareView';
import { useAltTextSupported } from '../../../../../lib/hooks/useAltTextSupported';
import I18n from '../../../../../i18n';

const ImageContainer = ({
	file,
	showAttachment,
	getCustomEmoji,
	author,
	msg,
	imagePreview,
	imageType
}: IImageContainer): ReactElement | null => {
	'use memo';

	const user = useMessageUser();
	const { status, onPress, url, isEncrypted } = useMediaAutoDownload({ file, author, showAttachment });
	const isAltTextSupported = useAltTextSupported();
	const altText = file.altText || (isAltTextSupported ? msg : undefined);
	// When no description and no caption above, fall back to a generic label so screen readers don't announce just "image button".
	const accessibilityLabel = altText?.trim() || I18n.t('A11y_image_no_description');

	const image = (
		<Button accessibilityLabel={accessibilityLabel} onPress={onPress}>
			<WidthAwareView>
				<MessageImage uri={url} status={status} encrypted={isEncrypted} imagePreview={imagePreview} imageType={imageType} />
			</WidthAwareView>
		</Button>
	);

	// server >= 8.4: description is alt text — show pill label below the image
	if (isAltTextSupported && altText) {
		return (
			<View style={{ gap: 4 }}>
				{image}
				<AltTextLabel altText={altText} />
			</View>
		);
	}

	// server < 8.4: description is a caption — render as Markdown above the image
	if (msg) {
		return (
			<View style={{ gap: 4 }}>
				<Markdown msg={msg} username={user?.username} getCustomEmoji={getCustomEmoji} />
				{image}
			</View>
		);
	}

	return image;
};

ImageContainer.displayName = 'MessageImageContainer';

export default ImageContainer;
