import { isAndroid } from '../../utils/deviceInfo';

// Limit preview to 5MB on iOS share extension
export const allowPreview = (isShareExtension, size) => isAndroid || !isShareExtension || size < 5000000;
