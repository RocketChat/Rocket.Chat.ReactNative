import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { ImageComponent } from './ImageComponent';
import { themes } from '../../constants/colors';

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
	uri, imageComponentType, theme, width, height, ...props
}) => {
	const backgroundColor = themes[theme].previewBackground;
	const Component = ImageComponent(imageComponentType);
	return (
		<ScrollView
			style={{ backgroundColor }}
			contentContainerStyle={[
				styles.scrollContent,
				width && { width },
				height && { height }
			]}
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
	imageComponentType: PropTypes.string,
	width: PropTypes.number,
	height: PropTypes.number,
	theme: PropTypes.string
};
