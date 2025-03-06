import { URL } from 'react-native-url-polyfill';

import { isImageBase64 } from '../isImageBase64';
import { store } from '../../store/auxStore';

function setParamInUrl({ url, token, userId }: { url: string; token: string; userId: string }) {
	const urlObj = new URL(url);
	urlObj.searchParams.set('rc_token', token);
	urlObj.searchParams.set('rc_uid', userId);
	return urlObj.toString();
}

export const formatAttachmentUrl = (attachmentUrl: string | undefined, userId: string, token: string, server: string): string => {
	const protectFiles = store.getState().settings.FileUpload_ProtectFiles;

	if ((attachmentUrl && isImageBase64(attachmentUrl)) || attachmentUrl?.startsWith('file://')) {
		return attachmentUrl;
	}
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}

		if (protectFiles) return setParamInUrl({ url: attachmentUrl, token, userId });
		return attachmentUrl;
	}
	let cdnPrefix = store?.getState().settings.CDN_PREFIX as string;
	cdnPrefix = cdnPrefix?.trim();
	if (cdnPrefix && cdnPrefix.startsWith('http')) {
		server = cdnPrefix.replace(/\/+$/, '');
	}
	if (protectFiles) return setParamInUrl({ url: `${server}${attachmentUrl}`, token, userId });
	return `${server}${attachmentUrl}`;
};
