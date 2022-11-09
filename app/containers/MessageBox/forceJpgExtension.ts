import { ImageOrVideo } from 'react-native-image-crop-picker';

import { isIOS } from '../../lib/methods/helpers';

const regex = new RegExp(/\.[^/.]+$/); // Check from last '.' of the string

export const forceJpgExtension = (attachment: ImageOrVideo): ImageOrVideo => {
	if (isIOS && attachment.mime === 'image/jpeg' && attachment.filename) {
		// Replace files extension that mime type is 'image/jpeg' to .jpg;
		attachment.filename = attachment.filename.replace(regex, '.jpg');
	}
	if (isIOS && attachment.mime === 'image/gif' && attachment.filename) {
		// Fixed issue for gif sent from iOS. 'react-native-image-crop-picker' saves gif as jpg in 'tmp' directory
		// which causes issue and gif appears as static jpg image, updated path to orignal gif source instead of 'tmp' directory only for gif
		attachment.path = attachment.sourceURL ?? attachment.path;
	}
	return attachment;
};
