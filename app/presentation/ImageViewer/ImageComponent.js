import { types } from './types';

export const ImageComponent = (type) => {
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
