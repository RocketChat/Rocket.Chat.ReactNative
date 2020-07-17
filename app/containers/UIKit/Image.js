import React from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import ImageContainer from '../message/Image';
import Navigation from '../../lib/Navigation';

const styles = StyleSheet.create({
	image: {
		borderRadius: 2
	},
	mediaContext: {
		marginRight: 8
	}
});

const ThumbContext = args => <View style={styles.mediaContext}><Thumb size={20} {...args} /></View>;

export const Thumb = ({ element, size = 88 }) => (
	<FastImage
		style={[{ width: size, height: size }, styles.image]}
		source={{ uri: element.imageUrl }}
	/>
);
Thumb.propTypes = {
	element: PropTypes.object,
	size: PropTypes.number
};

export const Media = ({ element, theme }) => {
	const showAttachment = attachment => Navigation.navigate('AttachmentView', { attachment });
	const { imageUrl } = element;

	return (
		<ImageContainer
			file={{ image_url: imageUrl }}
			imageUrl={imageUrl}
			showAttachment={showAttachment}
			theme={theme}
		/>
	);
};
Media.propTypes = {
	element: PropTypes.object,
	theme: PropTypes.string
};

const genericImage = (element, context, theme) => {
	switch (context) {
		case BLOCK_CONTEXT.SECTION:
			return <Thumb element={element} />;
		case BLOCK_CONTEXT.CONTEXT:
			return <ThumbContext element={element} />;
		default:
			return <Media element={element} theme={theme} />;
	}
};

export const Image = ({ element, context, theme }) => genericImage(element, context, theme);
