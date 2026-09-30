export type TMemberRoleGroup = 'owner' | 'leader' | 'moderator' | 'member';

export type TMemberListItem<T> = { type: 'header'; group: TMemberRoleGroup; count: number } | { type: 'member'; member: T };

export const getMemberRoleGroup = (roles?: string[]): TMemberRoleGroup => {
	if (roles?.includes('owner')) {
		return 'owner';
	}
	if (roles?.includes('leader')) {
		return 'leader';
	}
	if (roles?.includes('moderator')) {
		return 'moderator';
	}
	return 'member';
};

// Expects members already sorted by role, as returned by rooms.membersOrderedByRole
export const groupMembersByRole = <T extends { roles?: string[] }>(members: T[]): TMemberListItem<T>[] => {
	const items: TMemberListItem<T>[] = [];
	let currentHeader: Extract<TMemberListItem<T>, { type: 'header' }> | undefined;
	members.forEach(member => {
		const group = getMemberRoleGroup(member.roles);
		if (group !== currentHeader?.group) {
			currentHeader = { type: 'header', group, count: 0 };
			items.push(currentHeader);
		}
		currentHeader.count += 1;
		items.push({ type: 'member', member });
	});
	return items;
};
