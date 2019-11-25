import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { withSplit } from '../../split';
import sharedStyles from '../../views/Styles';

const Button = React.memo(({ children, onPress, split }) => (
	<Touchable
		onPress={onPress}
		style={[styles.imageContainer, split && sharedStyles.tabletContent]}
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
	file, baseUrl, user, useMarkdown, onOpenFileModal, getCustomEmoji, split
}) => {
	const img = formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	const onPress = () => onOpenFileModal(file);

	if (file.description) {
		return (
			<Button split={split} onPress={onPress}>
				<View>
					<Image img={img} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} useMarkdown={useMarkdown} />
				</View>
			</Button>
		);
	}

	return (
		<Button split={split} onPress={onPress}>
			<Image img={img} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) && prevProps.split === nextProps.split);

ImageContainer.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	useMarkdown: PropTypes.bool,
	onOpenFileModal: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	split: PropTypes.bool
};
ImageContainer.displayName = 'MessageImageContainer';

Image.propTypes = {
	img: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

Button.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	split: PropTypes.bool
};
ImageContainer.displayName = 'MessageButton';

export default withSplit(ImageContainer);
