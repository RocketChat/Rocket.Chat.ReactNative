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
		return protocol === 'http:' || protocol === 'https:' ? origin.toLowerCase() : null;
	} catch {
		return null;
	}
};

const getCdnPrefix = (): string => {
	const cdnPrefix = (store.getState().settings.CDN_PREFIX as string | undefined)?.trim()?.replace(/\/+$/, '');
	return cdnPrefix && getOrigin(cdnPrefix) ? cdnPrefix : '';
};

export const formatAttachmentUrl = (
	attachmentUrl: string | undefined,
	userId: string,
	token: string,
	server: string,
	originalUrl?: string | null
): string => {
	if (!attachmentUrl) {
		return '';
	}
	if (isImageBase64(attachmentUrl) || attachmentUrl.startsWith('file://')) {
		return attachmentUrl;
	}

	const { FileUpload_ProtectFiles: protectFiles, Site_Url: siteUrl } = store.getState().settings;
	const cdnPrefix = getCdnPrefix();
	const trustedOrigins = [getOrigin(server), getOrigin(cdnPrefix), getOrigin((siteUrl as string | undefined) ?? '')].filter(
		Boolean
	);
	const isTrusted = (url: string) => trustedOrigins.includes(getOrigin(url));

	const isAbsolute = /^https?:\/\//i.test(attachmentUrl);
	if (isAbsolute && originalUrl && !isTrusted(originalUrl)) {
		return originalUrl;
	}
	const url = isAbsolute ? attachmentUrl : `${cdnPrefix || server}/${attachmentUrl.replace(/^\/+/, '')}`;
	if (!isTrusted(url)) {
		return encodeAttachmentUrl(url);
	}
	return protectFiles ? setParamInUrl({ url, token, userId }) : encodeAttachmentUrl(url);
};
