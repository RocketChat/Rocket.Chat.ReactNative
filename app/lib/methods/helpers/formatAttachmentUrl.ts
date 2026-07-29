import { URL } from 'react-native-url-polyfill';

import { isImageBase64 } from '../isImageBase64';
import { store } from '../../store/auxStore';

function setParamInUrl({ url, token, userId }: { url: string; token: string; userId: string }) {
	const urlObj = new URL(url);
	urlObj.searchParams.set('rc_token', token);
	urlObj.searchParams.set('rc_uid', userId);
	return urlObj.toString();
}

/**
 * Percent-encodes a url without double-encoding one that already is. The server hands us attachment
 * paths already encoded (`/file-upload/<id>/Screen%20Recording.mov`), and a plain `encodeURI` turns
 * every `%` into `%25`, producing a path the server can't resolve. Decoding first makes the result
 * the same whichever form we were given. `decodeURI` leaves escapes for reserved characters alone,
 * so query string values survive the round trip; it throws on a malformed escape, hence the guard.
 */
export const encodeAttachmentUrl = (url: string): string => {
	try {
		return encodeURI(decodeURI(url));
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

	if ((attachmentUrl && isImageBase64(attachmentUrl)) || attachmentUrl?.startsWith('file://')) {
		return attachmentUrl;
	}
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (_originalUrl && !_originalUrl.startsWith(server)) {
			return _originalUrl;
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
