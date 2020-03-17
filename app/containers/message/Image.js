import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { withSplit } from '../../split';
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

const ImageProgress = createImageProgress(FastImage);

const Button = React.memo(({
	children, onPress, split, theme
}) => (
	<Touchable
		onPress={onPress}
		style={[styles.imageContainer, split && sharedStyles.tabletContent]}
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
	file, imageUrl, baseUrl, user, showAttachment, getCustomEmoji, split, theme
}) => {
	const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	const onPress = () => showAttachment(file);

	if (file.description) {
		return (
			<Button split={split} theme={theme} onPress={onPress}>
				<View>
					<MessageImage img={img} theme={theme} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button split={split} theme={theme} onPress={onPress}>
			<MessageImage img={img} theme={theme} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) && prevProps.split === nextProps.split && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	imageUrl: PropTypes.string,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	showAttachment: PropTypes.func,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	split: PropTypes.bool
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
	theme: PropTypes.string,
	split: PropTypes.bool
};
ImageContainer.displayName = 'MessageButton';

export default withSplit(ImageContainer);
