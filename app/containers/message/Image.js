import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
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
import { isIOS } from '../../utils/deviceInfo';
import openLink from '../../utils/openLink';

const ImageProgress = createImageProgress(FastImage);
const SUPPORTED_TYPES = ['videao/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;


const style = StyleSheet.create({
	containerVideo: {
		width: '100%',
		justifyContent: 'center'
	}
});

const Button = React.memo(({
	children, onPress, theme
}) => (
	<Touchable
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		{children}
	</Touchable>
));

export const MessageImage = React.memo(({ img, theme }) => (
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

const ImageContainer = React.memo(({
	file, imageUrl, showAttachment, getCustomEmoji, theme, children
}) => {
	const { baseUrl, user } = useContext(MessageContext);
	let img = imageUrl;

	if (file.image_url) {
		img = formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	}

	if (!img && !file.video_type) {
		return null;
	}

	const onPress = () => {
		if (file.video_type) {
			if (isTypeSupported(file.video_type)) {
				return showAttachment(file);
			}
			const uri = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
			return openLink(uri, theme);
		}
		return showAttachment(file);
	};

	if (file.description) {
		return (
			<Button theme={theme} onPress={onPress}>
				<View>
					<View style={style.containerVideo}>
						<MessageImage img={img} theme={theme} />
						{children}
					</View>
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button theme={theme} onPress={onPress}>
			<View style={style.containerVideo}>
				<MessageImage img={img} theme={theme} />
				{children}
			</View>
		</Button>
	);
}, (prevProps, nextProps) => dequal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	imageUrl: PropTypes.string,
	showAttachment: PropTypes.func,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	children: PropTypes.node
};
ImageContainer.displayName = 'MessageImageContainer';

MessageImage.propTypes = {
	img: PropTypes.string,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

Button.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageButton';

export default ImageContainer;
