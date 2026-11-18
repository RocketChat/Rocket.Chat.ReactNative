import { store as reduxStore } from '~/lib/store/auxStore';
import { isGroupChat } from './roomKind';

export function getRoomTitle(room: any) {
	const { UI_Use_Real_Name: useRealName, UI_Allow_room_names_with_special_chars: allowSpecialChars } =
		reduxStore.getState().settings;
	const { username } = reduxStore.getState().login.user;
	if ('federated' in room && room.federated === true) {
		return room.fname;
	}
	if (isGroupChat(room) && !(room.name && room.name.length) && room.usernames) {
		return room.usernames
			.filter((u: string) => u !== username)
			.sort((u1: string, u2: string) => u1.localeCompare(u2))
			.join(', ');
	}
	if (allowSpecialChars && room.t !== 'd') {
		return room.fname || room.name;
	}
	return ((room?.prid || useRealName) && room?.fname) || room?.name;
}
