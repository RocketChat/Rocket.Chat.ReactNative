import { getAudioUrl, getAudioUrlToCache } from './getAudioUrl';
import { getFilePath } from './handleMediaDownload';

export const getFilePathAudio = ({
	audioUrl,
	audioType,
	baseUrl,
	cdnPrefix,
	userId,
	token
}: {
	audioUrl?: string;
	audioType?: string;
	baseUrl: string;
	cdnPrefix: string;
	userId: string;
	token: string;
}) => {
	const url = getAudioUrl({ baseUrl, cdnPrefix, audioUrl });
	return getFilePath({
		urlToCache: getAudioUrlToCache({ token, userId, url }),
		type: 'audio',
		mimeType: audioType
	});
};
