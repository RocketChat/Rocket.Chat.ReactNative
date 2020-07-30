import React, { useContext } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from '@rocket.chat/react-native-fast-image';
import equal from 'deep-equal';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';

const ImageProgress = createImageProgress(FastImage);

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
	file, imageUrl, showAttachment, getCustomEmoji, theme
}) => {
	const { baseUrl, user } = useContext(MessageContext);
	const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	const onPress = () => showAttachment(file);

	if (file.description) {
		return (
			<Button theme={theme} onPress={onPress}>
				<View>
					<MessageImage img={img} theme={theme} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button theme={theme} onPress={onPress}>
			<MessageImage img={img} theme={theme} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	imageUrl: PropTypes.string,
	showAttachment: PropTypes.func,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func
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
