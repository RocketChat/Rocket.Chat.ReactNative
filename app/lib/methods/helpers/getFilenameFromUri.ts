export const getFilenameFromUri = (uri?: string): string | undefined => {
	if (!uri) {
		return undefined;
	}
	const basename = uri.substring(uri.lastIndexOf('/') + 1).split('?')[0];
	try {
		return decodeURIComponent(basename);
	} catch {
		return basename;
	}
};
