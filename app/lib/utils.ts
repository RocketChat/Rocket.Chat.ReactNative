import { coerce, gt, gte, lt, lte, SemVer } from 'semver';

export const formatAttachmentUrl = (attachmentUrl: string, userId: string, token: string, server: string): string => {
	if (attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return encodeURI(`${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
	}
	return encodeURI(`${server}${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
};

const methods = {
	lowerThan: lt,
	lowerThanOrEqualTo: lte,
	greaterThan: gt,
	greaterThanOrEqualTo: gte
};

export const compareServerVersion = (
	currentServerVersion: string | null | undefined,
	method: keyof typeof methods,
	versionToCompare: string
): boolean =>
	(currentServerVersion && methods[method](coerce(currentServerVersion) as string | SemVer, versionToCompare)) as boolean;

export const generateLoadMoreId = (id: string): string => `load-more-${id}`;
