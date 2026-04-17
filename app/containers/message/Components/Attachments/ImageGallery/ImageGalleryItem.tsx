import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import { type IAttachment, type IUserMessage } from '../../../../../definitions';
import { type TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { useTheme } from '../../../../../theme';
import { useMediaAutoDownload } from '../../../hooks/useMediaAutoDownload';
import { WidthAwareContext } from '../../WidthAwareView';
import Touchable from '../../../Touchable';
import { MessageImage } from '../Image/Image';
import MessageContext from '../../../Context';
import { getMessageFromAttachment } from '../../../utils';
import styles from './styles';

interface IImageGalleryItem {
	file: IAttachment;
	author?: IUserMessage;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji?: TGetCustomEmoji;
	width: number;
	height: number;
	overflowCount?: number;
}

const ImageGalleryItem = ({ file, author, showAttachment, width, height, overflowCount = 0 }: IImageGalleryItem) => {
	const { colors } = useTheme();
	const { translateLanguage } = useContext(MessageContext);
	const { status, onPress, url, isEncrypted } = useMediaAutoDownload({ file, author, showAttachment });
	const accessibilityLabel = getMessageFromAttachment(file, translateLanguage);

	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole='imagebutton'
			onPress={onPress}
			style={[styles.cell, { width, height }]}>
			<WidthAwareContext.Provider value={width}>
				<MessageImage
					uri={url}
					status={status}
					encrypted={isEncrypted}
					imagePreview={file.image_preview}
					imageType={file.image_type}
				/>
			</WidthAwareContext.Provider>
			{overflowCount > 0 ? (
				<View style={[styles.overflayWrapper, { backgroundColor: colors.backdropColor }]}>
					<Text style={[styles.overflowText, { color: colors.fontWhite }]}>{`+${overflowCount}`}</Text>
				</View>
			) : null}
		</Touchable>
	);
};

ImageGalleryItem.displayName = 'ImageGalleryItem';

export default ImageGalleryItem;
