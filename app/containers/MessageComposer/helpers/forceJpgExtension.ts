import { ImageOrVideo } from 'react-native-image-crop-picker';

import { isIOS } from '../../../lib/methods/helpers';

const regex = new RegExp(/\.[^/.]+$/); // Check from last '.' of the string

export const forceJpgExtension = (attachment: ImageOrVideo): ImageOrVideo => {
	if (isIOS && attachment.mime === 'image/jpeg' && attachment.filename) {
		// Replace files extension that mime type is 'image/jpeg' to .jpg;
		attachment.filename = attachment.filename.replace(regex, '.jpg');
	}
	return attachment;
};
