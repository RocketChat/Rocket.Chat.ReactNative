import { getAudioUrl, getAudioUrlToCache } from './getAudioUrl';
import { store } from '../store/auxStore';
import { getFilePath } from './handleMediaDownload';
import { getUserSelector } from '../../selectors/login';

export const getFilePathAudio = ({ audioUrl, audioType }: { audioUrl?: string; audioType?: string }): string | null => {
	const baseUrl = store.getState().server.server;
	const cdnPrefix = store.getState().settings.CDN_PREFIX as string;
	const { id: userId, token } = getUserSelector(store.getState());
	const url = getAudioUrl({ baseUrl, cdnPrefix, audioUrl });
	return getFilePath({
		urlToCache: getAudioUrlToCache({ token, userId, url }),
		type: 'audio',
		mimeType: audioType
	});
};
