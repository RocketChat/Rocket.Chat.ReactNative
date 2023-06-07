import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { BlockContext } from '@rocket.chat/ui-kit';

import ImageContainer from '../message/Image';
import Navigation from '../../lib/navigation/appNavigation';
import { IThumb, IImage, IElement } from './interfaces';
import { IAttachment } from '../../definitions';

const styles = StyleSheet.create({
	image: {
		borderRadius: 2
	},
	mediaContext: {
		marginRight: 8
	}
});

const ThumbContext = (args: IThumb) => (
	<View style={styles.mediaContext}>
		<Thumb size={20} {...args} />
	</View>
);

export const Thumb = ({ element, size = 88 }: IThumb) => (
	<FastImage style={[{ width: size, height: size }, styles.image]} source={{ uri: element?.imageUrl }} />
);

export const Media = ({ element }: IImage) => {
	const showAttachment = (attachment: IAttachment) => Navigation.navigate('AttachmentView', { attachment });
	const imageUrl = element?.imageUrl ?? '';

	return <ImageContainer file={{ image_url: imageUrl }} imageUrl={imageUrl} showAttachment={showAttachment} />;
};

const genericImage = (element: IElement, context?: number) => {
	switch (context) {
		case BlockContext.SECTION:
			return <Thumb element={element} />;
		case BlockContext.CONTEXT:
			return <ThumbContext element={element} />;
		default:
			return <Media element={element} />;
	}
};

export const Image = ({ element, context }: IImage) => genericImage(element, context);
