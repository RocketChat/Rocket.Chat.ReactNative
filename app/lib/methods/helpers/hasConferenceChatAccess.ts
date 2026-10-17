export const hasConferenceChatAccess = (membersWithoutAccess: string[], userId: string | undefined): boolean =>
	!userId || !membersWithoutAccess.includes(userId);
