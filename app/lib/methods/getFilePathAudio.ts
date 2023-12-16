import { getUserSelector } from '../../selectors/login';
import { store } from '../store/auxStore';
import { getFilePath } from './handleMediaDownload';
import { IAttachment } from '../../definitions/IAttachment';

export const getFilePathAudio = (file: IAttachment): string => {
	const baseUrl = store.getState().server.server;
	const cdnPrefix = store.getState().settings.CDN_PREFIX;
	const user = getUserSelector(store.getState());

	let url = file.audio_url;
	if (url && !url.startsWith('http')) {
		url = `${cdnPrefix || baseUrl}${url}`;
	}
	return getFilePath({
		urlToCache: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
		type: 'audio',
		mimeType: file.audio_type
	}) as string;
};
