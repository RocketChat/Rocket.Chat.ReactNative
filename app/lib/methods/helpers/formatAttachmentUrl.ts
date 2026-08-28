import { URL } from 'react-native-url-polyfill';

import { isImageBase64 } from '../isImageBase64';
import { store } from '../../store/auxStore';

function setParamInUrl({ url, token, userId }: { url: string; token: string; userId: string }) {
	const urlObj = new URL(url);
	urlObj.searchParams.set('rc_token', token);
	urlObj.searchParams.set('rc_uid', userId);
	return urlObj.toString();
}

// The server encodes the path with `encodeURI(file.name)`, which leaves `#` raw and truncates the url at the fragment.
const escapeFragmentDelimiter = (url: string) => url.replace(/#/g, '%23');

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

		const url = escapeFragmentDelimiter(attachmentUrl);

		if (url.includes('rc_token')) {
			return url;
		}

		if (protectFiles) return setParamInUrl({ url, token, userId });
		return url;
	}
	let cdnPrefix = store?.getState().settings.CDN_PREFIX as string;
	cdnPrefix = cdnPrefix?.trim();
	if (cdnPrefix && cdnPrefix.startsWith('http')) {
		server = cdnPrefix.replace(/\/+$/, '');
	}
	const url = escapeFragmentDelimiter(`${server}${attachmentUrl}`);
	if (protectFiles) return setParamInUrl({ url, token, userId });
	return url;
};
