import { ImageOrVideo } from 'react-native-image-crop-picker';

import { isIOS } from '../../utils/deviceInfo';

const regex = new RegExp(/\.[^/.]+$/); // Check from last '.' of the string

export const forceJpgExtension = (attachment: ImageOrVideo) => {
	if (isIOS && attachment.mime === 'image/jpeg' && attachment.filename) {
		attachment.filename = attachment.filename.replace(regex, '.jpg'); // Replace files that ends with .jpg | .heic | .jpeg to .jpg;
	}
	return attachment;
};
