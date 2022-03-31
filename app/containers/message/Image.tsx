import React, { useContext } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
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

type TMessageButton = {
	children: JSX.Element;
	disabled?: boolean;
	onPress: Function;
	theme: string;
};

type TMessageImage = {
	img: string;
	theme: string;
};

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: Function;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
}

const ImageProgress = createImageProgress(FastImage);

const Button = React.memo(({ children, onPress, disabled, theme }: TMessageButton) => (
	<Touchable
		disabled={disabled}
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple(themes[theme].bannerBackground)}>
		{children}
	</Touchable>
));

export const MessageImage = React.memo(({ img, theme }: TMessageImage) => (
	<ImageProgress
		style={[styles.image, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
		indicator={Progress.Pie}
		indicatorProps={{
			color: themes[theme].actionTintColor
		}}
	/>
));

const ImageContainer = React.memo(
	({ file, imageUrl, showAttachment, getCustomEmoji, style, isReply }: IMessageImage) => {
		const { theme } = useTheme();
		const { baseUrl, user } = useContext(MessageContext);
		const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
		if (!img) {
			return null;
		}

		const onPress = () => {
			if (!showAttachment) {
				return;
			}

			return showAttachment(file);
		};

		if (file.description) {
			return (
				<Button disabled={isReply} theme={theme} onPress={onPress}>
					<View>
						<Markdown
							msg={file.description}
							style={[isReply && style]}
							baseUrl={baseUrl}
							username={user.username}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
						/>
						<MessageImage img={img} theme={theme} />
					</View>
				</Button>
			);
		}

		return (
			<Button disabled={isReply} theme={theme} onPress={onPress}>
				<MessageImage img={img} theme={theme} />
			</Button>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
