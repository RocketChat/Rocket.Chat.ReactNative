import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

import { ImageComponent } from './ImageComponent';
import { useDimensions, useOrientation } from '../../dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHeaderHeight } from '../../containers/Header';

const styles = StyleSheet.create({
	scrollContent: {
		width: '100%',
		height: '100%',
		// flex: 1,
		// height: 400,
		backgroundColor: 'red',
		// paddingBottom: 88
	},
	image: {
		flex: 1
	}
});

export const ImageViewer = ({
	uri, imageComponentType, width, height, loading, ...props
}) => {
	const Component = ImageComponent(imageComponentType);
	const ref = useRef();
	useEffect(() => {
		ref.current.scrollTo({ x: 0, y: 0 });
		console.log(width, height)
	}, [])
	return (
		<ScrollView
			ref={ref}
			contentContainerStyle={[
				styles.scrollContent,
				width && { width },
				height && { height }
			]}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			maximumZoomScale={2}
		>
			{loading
				? <ActivityIndicator />
				: (
					<Component
						style={styles.image}
						resizeMode='contain'
						source={{ uri }}
						{...props}
					/>
				)}
		</ScrollView>
	);
};

ImageViewer.propTypes = {
	uri: PropTypes.string,
	imageComponentType: PropTypes.string
};
