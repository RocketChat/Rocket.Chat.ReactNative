export const isValidLink = (link: string): boolean => {
	try {
		return Boolean(new URL(link));
	} catch (error) {
		return false;
	}
};

export const buildImageURL = (url: string, imageUrl: string): string => {
	if (isValidLink(imageUrl)) {
		return imageUrl;
	}

	const { origin } = new URL(url);
	const imgURL = `${origin}/${imageUrl}`;
	const normalizedUrl = imgURL.replace(/([^:]\/)\/+/gm, '$1');

	return normalizedUrl;
};
