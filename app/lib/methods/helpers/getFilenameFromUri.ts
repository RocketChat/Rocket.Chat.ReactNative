import { decodeFilename } from './decodeFilename';
import { stripUuidPrefix } from './stripUuidPrefix';

export const getFilenameFromUri = (uri?: string): string | undefined => {
	if (!uri) {
		return undefined;
	}
	const basename = uri.substring(uri.lastIndexOf('/') + 1).split('?')[0];
	return stripUuidPrefix(decodeFilename(basename));
};
