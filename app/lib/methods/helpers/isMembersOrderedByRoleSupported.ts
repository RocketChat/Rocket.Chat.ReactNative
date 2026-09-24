import { compareServerVersion } from './compareServerVersion';

// rooms.membersOrderedByRole (RC 7.3.0) only accepts public and private rooms
export const isMembersOrderedByRoleSupported = (serverVersion: string | null | undefined, roomType: string): boolean =>
	(roomType === 'c' || roomType === 'p') && !!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.3.0');
