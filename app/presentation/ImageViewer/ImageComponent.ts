import React from 'react';
import { Image } from 'react-native';
import { FastImageProps } from '@rocket.chat/react-native-fast-image';

import { types } from './types';

export const ImageComponent = (type?: string): React.ComponentType<Partial<Image> | FastImageProps> => {
	let Component;
	if (type === types.REACT_NATIVE_IMAGE) {
		const { Image } = require('react-native');
		Component = Image;
	} else {
		const FastImage = require('@rocket.chat/react-native-fast-image').default;
		Component = FastImage;
	}
	return Component;
};
