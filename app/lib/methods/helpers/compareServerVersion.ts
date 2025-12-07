import { coerce, gt, gte, lt, lte, type SemVer } from 'semver';

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
