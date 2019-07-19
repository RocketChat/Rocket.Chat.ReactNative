import React from 'react';
import {
	ScrollView
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';

const ImageViewer = React.memo(({ source }) => (
	<ScrollView
		maximumZoomScale={2}
		minimumZoomScale={1}
	>
		<FastImage
			source={{ uri: source }}
		/>
	</ScrollView>
));

ImageViewer.propTypes = {
	source: PropTypes.string
};

export default ImageViewer;
