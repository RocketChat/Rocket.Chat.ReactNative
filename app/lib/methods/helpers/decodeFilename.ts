const UUID_PREFIX_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/;

export const stripUuidPrefix = (filename: string): string => filename.replace(UUID_PREFIX_REGEX, '');

export const decodeFilename = (value?: string): string | undefined => {
	if (!value) {
		return value;
	}
	let decoded = value;
	for (let i = 0; i < 3; i += 1) {
		if (!decoded.includes('%')) {
			break;
		}
		try {
			const next = decodeURIComponent(decoded);
			if (next === decoded) {
				break;
			}
			decoded = next;
		} catch {
			try {
				const next = decodeURI(decoded);
				if (next === decoded) {
					break;
				}
				decoded = next;
			} catch {
				break;
			}
		}
	}
	return decoded;
};

export const getFilenameFromUri = (uri?: string): string | undefined => {
	if (!uri) {
		return undefined;
	}
	const basename = uri.substring(uri.lastIndexOf('/') + 1).split('?')[0];
	return stripUuidPrefix(decodeFilename(basename) ?? basename);
};
