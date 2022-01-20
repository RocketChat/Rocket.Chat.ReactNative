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

type TMethods = typeof lt | typeof gt | typeof gte | typeof lte;

type TFunc<T> = T;

export const compareServerVersion = (
	currentServerVersion: string,
	versionToCompare: string,
	func: TFunc<TMethods>
): boolean | string | null => currentServerVersion && func(coerce(currentServerVersion) as string | SemVer, versionToCompare);

export const generateLoadMoreId = (id: string): string => `load-more-${id}`;
