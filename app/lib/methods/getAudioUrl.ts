export const getAudioUrl = ({ audioUrl, baseUrl, cdnPrefix }: { audioUrl?: string; baseUrl: string; cdnPrefix: string }) => {
	if (audioUrl && !audioUrl.startsWith('http')) {
		audioUrl = `${cdnPrefix || baseUrl}${audioUrl}`;
	}
	return audioUrl;
};

export const getAudioUrlToCache = ({ token, userId, url }: { url?: string; userId: string; token: string }) => {
	if (!url) {
		return url;
	}
	return `${url}${url.includes('?') ? '&' : '?'}rc_uid=${userId}&rc_token=${token}`;
};
