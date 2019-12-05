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
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

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

const Image = React.memo(({ img, theme }) => (
	<FastImage
		style={[styles.image, { borderColor: themes[theme].borderColor }]}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.cover}
	/>
));

const ImageContainer = React.memo(({
	file, baseUrl, user, useMarkdown, onOpenFileModal, getCustomEmoji, split, theme
}) => {
	const img = formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	const onPress = () => onOpenFileModal(file);

	if (file.description) {
		return (
			<Button split={split} theme={theme} onPress={onPress}>
				<View>
					<Image img={img} theme={theme} />
					<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} useMarkdown={useMarkdown} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button split={split} theme={theme} onPress={onPress}>
			<Image img={img} theme={theme} />
		</Button>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) && prevProps.split === nextProps.split && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	useMarkdown: PropTypes.bool,
	onOpenFileModal: PropTypes.func,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	split: PropTypes.bool
};
ImageContainer.displayName = 'MessageImageContainer';

Image.propTypes = {
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
