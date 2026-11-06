export const getMembersWithoutChatAccess = <T extends { _id: string }>(users: T[], membersWithoutAccess: string[]): T[] =>
	users.filter(({ _id }) => membersWithoutAccess.includes(_id));
