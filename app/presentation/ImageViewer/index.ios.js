import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

const styles = StyleSheet.create({
	scrollContent: {
		width: '100%',
		height: '100%'
	},
	image: {
		flex: 1
	}
});

const ImageViewer = ({
	uri, ...props
}) => (
	<ScrollView
		contentContainerStyle={styles.scrollContent}
		showsHorizontalScrollIndicator={false}
		showsVerticalScrollIndicator={false}
		maximumZoomScale={2}
	>
		<FastImage
			style={styles.image}
			resizeMode='contain'
			source={{
				uri,
				headers: RocketChatSettings.customHeaders
			}}
			{...props}
		/>
	</ScrollView>
);

ImageViewer.propTypes = {
	uri: PropTypes.string
};

export default ImageViewer;
