export const isGroupChat = (room?: { uids?: string[]; usernames?: string[] } | null): boolean =>
	(room?.uids?.length ?? 0) > 2 || (room?.usernames?.length ?? 0) > 2;

export const isTeamRoom = ({ teamId, joined }: { teamId?: string; joined?: boolean }): boolean => (!!teamId && joined) ?? false;
