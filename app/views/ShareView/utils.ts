import { isAndroid } from '../../lib/methods/helpers';

// Limit preview to 3MB on iOS share extension
export const allowPreview = (isShareExtension: boolean, size: number): boolean =>
	isAndroid || !isShareExtension || size < 3000000;
