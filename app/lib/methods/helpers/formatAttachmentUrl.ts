import { URL } from 'react-native-url-polyfill';

import { isImageBase64 } from '../isImageBase64';
import { store } from '../../store/auxStore';

function setParamInUrl({ url, token, userId }: { url: string; token: string; userId: string }) {
	const urlObj = new URL(url);
	urlObj.searchParams.set('rc_token', token);
	urlObj.searchParams.set('rc_uid', userId);
	return urlObj.toString();
}

export const encodeAttachmentUrl = (url: string): string => {
	try {
		return new URL(url).toString();
	} catch {
		return url;
	}
};

export const formatAttachmentUrl = (
	attachmentUrl: string | undefined,
	userId: string,
	token: string,
	server: string,
	_originalUrl?: string | null
): string => {
	const protectFiles = store.getState().settings.FileUpload_ProtectFiles;

	// A data: uri is already its own encoding — running it through the parser would corrupt the payload.
	if (attachmentUrl && isImageBase64(attachmentUrl)) {
		return attachmentUrl;
	}
	// Cache filenames keep unicode letters (sanitizeLikeString only strips `[^\p{L}\p{Nd}]`), so `vídeo.mov` reaches
	// here verbatim and the native players reject the unescaped path. Encode local uris too.
	if (attachmentUrl?.startsWith('file://')) {
		return encodeAttachmentUrl(attachmentUrl);
	}
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (_originalUrl && !_originalUrl.startsWith(server)) {
			return encodeAttachmentUrl(_originalUrl);
		}

		if (attachmentUrl.includes('rc_token')) {
			return encodeAttachmentUrl(attachmentUrl);
		}

		if (protectFiles) return encodeAttachmentUrl(setParamInUrl({ url: attachmentUrl, token, userId }));
		return encodeAttachmentUrl(attachmentUrl);
	}
	let cdnPrefix = store?.getState().settings.CDN_PREFIX as string;
	cdnPrefix = cdnPrefix?.trim();
	if (cdnPrefix && cdnPrefix.startsWith('http')) {
		server = cdnPrefix.replace(/\/+$/, '');
	}
	if (protectFiles) return encodeAttachmentUrl(setParamInUrl({ url: `${server}${attachmentUrl}`, token, userId }));
	return encodeAttachmentUrl(`${server}${attachmentUrl}`);
};
