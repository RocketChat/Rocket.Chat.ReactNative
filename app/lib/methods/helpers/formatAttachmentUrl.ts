import { URL } from 'react-native-url-polyfill';

import { isImageBase64 } from '../isImageBase64';
import { store } from '~/lib/store/auxStore';

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

const getOrigin = (url: string): string | null => {
	try {
		const { protocol, origin } = new URL(url);
		return protocol === 'http:' || protocol === 'https:' ? origin : null;
	} catch {
		return null;
	}
};

const getCdnPrefix = (): string => {
	const cdnPrefix = (store.getState().settings.CDN_PREFIX as string | undefined)?.trim();
	return cdnPrefix?.startsWith('http') ? cdnPrefix.replace(/\/+$/, '') : '';
};

const isTrustedUrl = (url: string, server: string): boolean => {
	const origin = getOrigin(url);
	return !!origin && (origin === getOrigin(server) || origin === getOrigin(getCdnPrefix()));
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
	const isAbsolute = !!attachmentUrl?.startsWith('http');
	if (isAbsolute && _originalUrl && !isTrustedUrl(_originalUrl, server)) {
		return _originalUrl;
	}
	const url =
		isAbsolute && attachmentUrl ? attachmentUrl : `${getCdnPrefix() || server}/${(attachmentUrl ?? '').replace(/^\/+/, '')}`;
	if (!isTrustedUrl(url, server)) {
		return url;
	}
	if (isAbsolute && url.includes('rc_token')) {
		return encodeAttachmentUrl(url);
	}
	if (protectFiles) return setParamInUrl({ url, token, userId });
	return url;
};
