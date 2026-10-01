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

const getOrigin = (url: string | undefined | null): string | null => {
	if (!url) {
		return null;
	}
	try {
		const { protocol, username, password, origin } = new URL(url);
		if ((protocol !== 'http:' && protocol !== 'https:') || username || password) {
			return null;
		}
		return origin;
	} catch {
		return null;
	}
};

const getCdnPrefix = (): string => {
	const cdnPrefix = (store?.getState().settings.CDN_PREFIX as string | undefined)?.trim();
	return cdnPrefix?.startsWith('http') ? cdnPrefix.replace(/\/+$/, '') : '';
};

const isTrustedUrl = (url: string | undefined | null, server: string): boolean => {
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
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (_originalUrl && !isTrustedUrl(_originalUrl, server)) {
			return _originalUrl;
		}

		// Never send the session credentials to a host other than the workspace (or its CDN).
		if (!isTrustedUrl(attachmentUrl, server)) {
			return attachmentUrl;
		}

		if (attachmentUrl.includes('rc_token')) {
			return encodeAttachmentUrl(attachmentUrl);
		}

		if (protectFiles) return setParamInUrl({ url: attachmentUrl, token, userId });
		return attachmentUrl;
	}
	const cdnPrefix = getCdnPrefix();
	if (cdnPrefix) {
		server = cdnPrefix;
	}
	const url = `${server}${attachmentUrl}`;
	if (protectFiles && isTrustedUrl(url, server)) return setParamInUrl({ url, token, userId });
	return url;
};
