import { decodeFilename } from './decodeFilename';

export const getFilenameFromUri = (uri?: string): string | undefined => {
	if (!uri) {
		return undefined;
	}
	const basename = uri.substring(uri.lastIndexOf('/') + 1).split('?')[0];
	return decodeFilename(basename);
};
