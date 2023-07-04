import React from 'react';
import { Image } from 'react-native';
import { FastImageProps } from 'react-native-fast-image';

import { types } from './types';
import { LOCAL_DOCUMENT_DIRECTORY } from '../../lib/methods/handleMediaDownload';

export function ImageComponent({
	type,
	uri
}: {
	type?: string;
	uri: string;
}): React.ComponentType<Partial<Image> | FastImageProps> {
	let Component;
	if (type === types.REACT_NATIVE_IMAGE || (LOCAL_DOCUMENT_DIRECTORY && uri.startsWith(LOCAL_DOCUMENT_DIRECTORY))) {
		const { Image } = require('react-native');
		Component = Image;
	} else {
		const FastImage = require('react-native-fast-image');
		Component = FastImage;
	}
	return Component;
};
