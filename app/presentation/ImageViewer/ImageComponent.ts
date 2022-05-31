import React from 'react';
import { Image } from 'react-native';
import { FastImageProps } from 'react-native-fast-image';

import { types } from './types';

export const ImageComponent = (type?: string): React.ComponentType<Partial<Image> | FastImageProps> => {
	let Component;
	if (type === types.REACT_NATIVE_IMAGE) {
		const { Image } = require('react-native');
		Component = Image;
	} else {
		const FastImage = require('react-native-fast-image');
		Component = FastImage;
	}
	return Component;
};
