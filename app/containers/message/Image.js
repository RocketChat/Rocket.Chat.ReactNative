import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';

const Button = React.memo(({ children, onPress }) => (
	<Touchable
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple('#fff')}
	>
		{children}
	</Touchable>
));

const Image = React.memo(({ img, theme }) => (
	<FastImage
		style={[styles.image, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
	/>
));

const ImageContainer = React.memo(({
	file, baseUrl, user, useMarkdown, onOpenFileModal, getCustomEmoji, theme
}) => {
	const img = formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	const onPress = () => onOpenFileModal(file);

	if (file.description) {
		return (
			<Button onPress={onPress}>
				<View>
					<Image img={img} theme={theme} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} useMarkdown={useMarkdown} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button onPress={onPress}>
			<Image img={img} theme={theme} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file));

ImageContainer.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	useMarkdown: PropTypes.bool,
	onOpenFileModal: PropTypes.func,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func
};
ImageContainer.displayName = 'MessageImageContainer';

Image.propTypes = {
	img: PropTypes.string,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

Button.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func
};
ImageContainer.displayName = 'MessageButton';

export default ImageContainer;
