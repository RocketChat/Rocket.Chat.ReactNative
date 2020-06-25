import { isAndroid } from '../../utils/deviceInfo';

// Limit preview to 5MB on iOS share extension
export const allowPreview = (shareExtension, size) => isAndroid || !shareExtension || size < 5000000;
