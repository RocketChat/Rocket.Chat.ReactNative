import { coerce, gt, gte, lt, lte } from 'semver';

export const formatAttachmentUrl = (attachmentUrl: string, userId: string, token: string, server: string): string => {
	if (attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return encodeURI(`${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
	}
	return encodeURI(`${server}${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
};

export const methods = {
	lowerThan: lt,
	lowerThanOrEqualTo: lte,
	greaterThan: gt,
	greaterThanOrEqualTo: gte
} as const;

type ValueOf<T> = T[keyof T];

export const compareServerVersion = (
	currentServerVersion: string,
	versionToCompare: string,
	func: ValueOf<typeof methods>
): boolean => currentServerVersion && func(coerce(currentServerVersion), versionToCompare);

export const generateLoadMoreId = (id: string): string => `load-more-${id}`;
