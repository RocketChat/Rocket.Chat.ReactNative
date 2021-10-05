import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
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

interface IThumb {
	element: {
		imageUrl: string;
	};
	size?: number;
}

interface IMedia {
	element: {
		imageUrl: string;
	};
	theme: string;
}

interface IImage {
	element: any;
	context: any;
	theme: string;
}

const ThumbContext = (args: any) => (
	<View style={styles.mediaContext}>
		<Thumb size={20} {...args} />
	</View>
);

export const Thumb = ({ element, size = 88 }: IThumb) => (
	<FastImage style={[{ width: size, height: size }, styles.image]} source={{ uri: element.imageUrl }} />
);

export const Media = ({ element, theme }: IMedia) => {
	const showAttachment = (attachment: any) => Navigation.navigate('AttachmentView', { attachment });
	const { imageUrl } = element;
	// @ts-ignore
	return <ImageContainer file={{ image_url: imageUrl }} imageUrl={imageUrl} showAttachment={showAttachment} theme={theme} />;
};

const genericImage = (element: any, context: any, theme: string) => {
	switch (context) {
		case BLOCK_CONTEXT.SECTION:
			return <Thumb element={element} />;
		case BLOCK_CONTEXT.CONTEXT:
			return <ThumbContext element={element} />;
		default:
			return <Media element={element} theme={theme} />;
	}
};

export const Image = ({ element, context, theme }: IImage) => genericImage(element, context, theme);
