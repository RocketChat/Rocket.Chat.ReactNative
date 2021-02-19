import { lt, gte, coerce } from 'semver';

export const formatAttachmentUrl = (attachmentUrl, userId, token, server) => {
	if (attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return encodeURI(`${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`);
	}
	return encodeURI(`${ server }${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`);
};

export const isServerVersionLowerThan = (currentServerVersion, oldServerVersion) => lt(coerce(currentServerVersion), oldServerVersion);

export const isServerVersionGreaterThan = (currentServerVersion, oldServerVersion) => gte(coerce(currentServerVersion), oldServerVersion);
