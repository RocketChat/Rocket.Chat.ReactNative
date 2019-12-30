import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

const styles = StyleSheet.create({
	mediaContext: {
		marginRight: 8
	}
});

const MediaContext = args => <View style={styles.mediaContext}><Media size={20} {...args} /></View>;

const Media = ({ element, size = 88 }) => (
	<Image
		style={{ width: size, height: size }}
		source={{ uri: element.imageUrl }}
	/>
);
Media.propTypes = {
	element: PropTypes.object,
	size: PropTypes.number
};

const genericImage = (element, context) => {
	// eslint-disable-next-line default-case
	switch (context) {
		case BLOCK_CONTEXT.SECTION:
			return <Media element={element} />;
		case BLOCK_CONTEXT.CONTEXT:
			return <MediaContext element={element} />;
	}
};

export const ModalImage = ({ element, context }) => genericImage(element, context) || <Media element={element} />;

export const MessageImage = ({ element, context }) => genericImage(element, context) || <Media element={element} />;
