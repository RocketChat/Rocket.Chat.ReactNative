export function isGroupChat(room: any): boolean {
	return ((room?.uids && room.uids.length > 2) || (room?.usernames && room.usernames.length > 2)) ?? false;
}
