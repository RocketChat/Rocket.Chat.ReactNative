import React from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Image as MessageImage } from '../message/Image';

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

export const Media = ({ element }) => (
	<MessageImage
		img={element.imageUrl}
		theme='light'
	/>
);
Media.propTypes = {
	element: PropTypes.object
};

const genericImage = (element, context) => {
	switch (context) {
		case BLOCK_CONTEXT.SECTION:
			return <Thumb element={element} />;
		case BLOCK_CONTEXT.CONTEXT:
			return <ThumbContext element={element} />;
		default:
			return <Media element={element} />;
	}
};

export const Image = ({ element, context }) => genericImage(element, context);
