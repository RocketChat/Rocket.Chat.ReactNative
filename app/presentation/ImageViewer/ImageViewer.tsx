import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

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

interface IImageViewer {
	uri: string;
	imageComponentType?: string;
	width: number;
	height: number;
	theme: string;
	onLoadEnd?: () => void;
}

export const ImageViewer = ({ uri, imageComponentType, theme, width, height, ...props }: IImageViewer): JSX.Element => {
	const backgroundColor = themes[theme].previewBackground;
	const Component = ImageComponent(imageComponentType);
	return (
		// @ts-ignore
		<ScrollView
			style={{ backgroundColor }}
			contentContainerStyle={[styles.scrollContent, width && { width }, height && { height }]}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			maximumZoomScale={2}>
			<Component style={styles.image} resizeMode='contain' source={{ uri }} {...props} />
		</ScrollView>
	);
};
