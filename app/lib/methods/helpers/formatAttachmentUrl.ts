import { URL } from 'react-native-url-polyfill';

import { LOCAL_DOCUMENT_DIRECTORY } from '../handleMediaDownload';
import { isImageBase64 } from '../isImageBase64';
import { store } from '../../store/auxStore';

function setParamInUrl({ url, token, userId }: { url: string; token: string; userId: string }) {
	const urlObj = new URL(url);
	urlObj.searchParams.set('rc_token', token);
	urlObj.searchParams.set('rc_uid', userId);
	return urlObj.toString();
}

export const formatAttachmentUrl = (attachmentUrl: string | undefined, userId: string, token: string, server: string): string => {
	if (
		(attachmentUrl && isImageBase64(attachmentUrl)) ||
		(LOCAL_DOCUMENT_DIRECTORY && attachmentUrl?.startsWith(LOCAL_DOCUMENT_DIRECTORY))
	) {
		return attachmentUrl;
	}
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return setParamInUrl({ url: attachmentUrl, token, userId });
	}
	const cdnPrefix = store?.getState().settings.CDN_PREFIX as string;
	if (cdnPrefix) {
		server = cdnPrefix.trim().replace(/\/+$/, '');
	}
	return setParamInUrl({ url: `${server}${attachmentUrl}`, token, userId });
};
