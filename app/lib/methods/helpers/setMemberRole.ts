export const setMemberRole = <T extends { _id: string; roles?: string[] }>(
	members: T[],
	userId: string,
	role: string,
	isAdded: boolean
): T[] =>
	members.map(member =>
		member._id === userId
			? { ...member, roles: [...(member.roles ?? []).filter(memberRole => memberRole !== role), ...(isAdded ? [role] : [])] }
			: member
	);
