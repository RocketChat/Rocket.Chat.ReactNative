import { isGroupChat } from './isGroupChat';

export function getRoomAvatar(room: any) {
	if (isGroupChat(room) && room.uids && room.usernames) {
		return room.uids.length + room.usernames.join();
	}
	return room.prid ? room.fname : room.name;
}
