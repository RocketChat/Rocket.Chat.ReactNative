import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import ImageContainer from '../message/Image';
import Navigation from '../../lib/Navigation';
import { IThumb, IImage, IElement } from './interfaces';
import { TThemeMode } from '../../definitions/ITheme';

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

export const Media = ({ element, theme }: IImage) => {
	const showAttachment = (attachment: any) => Navigation.navigate('AttachmentView', { attachment });
	const imageUrl = element?.imageUrl ?? '';
	// @ts-ignore
	// TODO: delete ts-ignore after refactor Markdown and ImageContainer
	return <ImageContainer file={{ image_url: imageUrl }} imageUrl={imageUrl} showAttachment={showAttachment} theme={theme} />;
};

const genericImage = (theme: TThemeMode, element: IElement, context?: number) => {
	switch (context) {
		case BLOCK_CONTEXT.SECTION:
			return <Thumb element={element} />;
		case BLOCK_CONTEXT.CONTEXT:
			return <ThumbContext element={element} />;
		default:
			return <Media element={element} theme={theme} />;
	}
};

export const Image = ({ element, context, theme }: IImage) => genericImage(theme, element, context);
