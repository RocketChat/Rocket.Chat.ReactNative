import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { ImageComponent } from './ImageComponent';

const styles = StyleSheet.create({
	scrollContent: {
		width: '100%',
		height: '100%'
	},
	image: {
		flex: 1
	}
});

export const ImageViewer = ({
	uri, imageComponentType, ...props
}) => {
	const Component = ImageComponent(imageComponentType);

	return (
		<ScrollView
			contentContainerStyle={styles.scrollContent}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			maximumZoomScale={2}
		>
			<Component
				style={styles.image}
				resizeMode='contain'
				source={{ uri }}
				{...props}
			/>
		</ScrollView>
	);
};

ImageViewer.propTypes = {
	uri: PropTypes.string,
	imageComponentType: PropTypes.string
};
