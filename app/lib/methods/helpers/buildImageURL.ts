export const isValidUrl = (link: string): boolean => {
	try {
		return Boolean(new URL(link));
	} catch (error) {
		return false;
	}
};

// https://github.com/RocketChat/Rocket.Chat/blob/5c145e3170f04e341be93a2a60f09b6cbdc46c73/apps/meteor/client/components/message/content/urlPreviews/buildImageURL.ts#L3
export const buildImageURL = (url: string, imageUrl: string): string => {
	if (isValidUrl(imageUrl)) {
		return imageUrl;
	}

	const { origin } = new URL(url);
	const imgURL = `${origin}/${imageUrl}`;
	const normalizedUrl = imgURL.replace(/([^:]\/)\/+/gm, '$1');

	return normalizedUrl;
};
