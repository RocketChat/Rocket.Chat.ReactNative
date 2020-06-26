import { isAndroid } from '../../utils/deviceInfo';

// Limit preview to 3MB on iOS share extension
export const allowPreview = (isShareExtension, size) => isAndroid || !isShareExtension || size < 3000000;
