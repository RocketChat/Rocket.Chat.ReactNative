const ELEVATED_ROLES = ['owner', 'leader', 'moderator'] as const;

export type TMemberRoleGroup = (typeof ELEVATED_ROLES)[number] | 'member';

export type TMemberListItem<T> = { type: 'header'; group: TMemberRoleGroup } | { type: 'member'; member: T };

export const getMemberRoleGroup = (roles: string[] = []): TMemberRoleGroup =>
	ELEVATED_ROLES.find(role => roles.includes(role)) ?? 'member';

export const groupMembersByRole = <T extends { roles?: string[] }>(members: T[]): TMemberListItem<T>[] => {
	const items: TMemberListItem<T>[] = [];
	let currentGroup: TMemberRoleGroup | undefined;
	members.forEach(member => {
		const group = getMemberRoleGroup(member.roles);
		if (group !== currentGroup) {
			currentGroup = group;
			items.push({ type: 'header', group });
		}
		items.push({ type: 'member', member });
	});
	return items;
};
