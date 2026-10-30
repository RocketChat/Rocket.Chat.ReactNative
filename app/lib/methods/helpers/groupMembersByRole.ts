const ELEVATED_ROLES = ['owner', 'leader', 'moderator'] as const;

export type TMemberRoleGroup = (typeof ELEVATED_ROLES)[number] | 'member';

const ROLE_GROUPS: TMemberRoleGroup[] = [...ELEVATED_ROLES, 'member'];

const getMemberRoleGroup = (roles: string[] = []): TMemberRoleGroup =>
	ELEVATED_ROLES.find(role => roles.includes(role)) ?? 'member';

export const groupMembersByRole = <T extends { roles?: string[] }>(members: T[]): { key: TMemberRoleGroup; data: T[] }[] =>
	ROLE_GROUPS.map(key => ({ key, data: members.filter(member => getMemberRoleGroup(member.roles) === key) })).filter(
		group => group.data.length
	);
