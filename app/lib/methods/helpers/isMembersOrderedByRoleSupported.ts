import { compareServerVersion } from './compareServerVersion';

export const isMembersOrderedByRoleSupported = (serverVersion: string | null | undefined, roomType: string): boolean =>
	(roomType === 'c' || roomType === 'p') && !!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.4.0');
