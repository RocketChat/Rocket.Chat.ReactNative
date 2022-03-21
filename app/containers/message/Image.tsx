import React, { useContext } from 'react';
import { View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import { dequal } from 'dequal';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { IAttachment } from '../../definitions';

interface IMessageImage {
	file: { image_url?: string; description?: string };
	imageUrl?: string;
	showAttachment: (file: IAttachment) => void;
	getCustomEmoji?: TGetCustomEmoji;
}

const ImageProgress = createImageProgress(FastImage);

const Button = React.memo(
	({ children, onPress, theme }: { children: React.ReactElement; onPress: () => void; theme: string }) => (
		<Touchable onPress={onPress} style={styles.imageContainer} background={Touchable.Ripple(themes[theme].bannerBackground)}>
			{children}
		</Touchable>
	)
);

export const MessageImage = React.memo(({ imgUri, theme }: { imgUri: string; theme: string }) => (
	<ImageProgress
		style={[styles.image, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(imgUri) }}
		resizeMode={FastImage.resizeMode.cover}
		indicator={Progress.Pie}
		indicatorProps={{
			color: themes[theme].actionTintColor
		}}
	/>
));

const ImageContainer = React.memo(
	({ file, imageUrl, showAttachment, getCustomEmoji }: IMessageImage) => {
		const { baseUrl, user } = useContext(MessageContext);
		const { theme } = useTheme();
		const img = imageUrl || (file.image_url ? formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl) : null);

		if (!img) {
			return null;
		}

		const onPress = () => showAttachment(file as IAttachment);

		if (file.description) {
			return (
				<Button theme={theme} onPress={onPress}>
					<View>
						<MessageImage imgUri={img} theme={theme} />
						<Markdown
							msg={file.description}
							baseUrl={baseUrl}
							username={user.username}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
						/>
					</View>
				</Button>
			);
		}

		return (
			<Button theme={theme} onPress={onPress}>
				<MessageImage imgUri={img} theme={theme} />
			</Button>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
