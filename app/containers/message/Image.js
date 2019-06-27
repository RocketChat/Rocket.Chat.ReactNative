import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import Markdown from './Markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';

const Button = React.memo(({ children, onPress }) => (
	<Touchable
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple('#fff')}
	>
		{children}
	</Touchable>
));

const Image = React.memo(({ img }) => (
	<FastImage
		style={styles.image}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
	/>
));

const ImageContainer = React.memo(({
	file, baseUrl, user, useMarkdown, onOpenFileModal, getCustomEmoji
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
					<Image img={img} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} useMarkdown={useMarkdown} />
				</View>
			</Button>
		);
	}

	return (
		<Button onPress={onPress}>
			<Image img={img} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file));

ImageContainer.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	useMarkdown: PropTypes.bool,
	onOpenFileModal: PropTypes.func,
	getCustomEmoji: PropTypes.func
};
ImageContainer.displayName = 'MessageImageContainer';

Image.propTypes = {
	img: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

Button.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func
};
ImageContainer.displayName = 'MessageButton';

export default ImageContainer;
