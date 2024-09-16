// @ts-nocheck - TEMP
import log from './log';
import { store as reduxStore } from '../../store/auxStore';
import database from '../../database';

export function isGroupChat(room): boolean {
	return ((room?.uids && room.uids.length > 2) || (room?.usernames && room.usernames.length > 2)) ?? false;
}

export function getRoomAvatar(room) {
	if (isGroupChat(room) && room.uids && room.usernames) {
		return room.uids.length + room.usernames.join();
	}
	return room.prid ? room.fname : room.name;
}

export function getUidDirectMessage(room) {
	const { id: userId } = reduxStore.getState().login.user;

	if (!room) {
		return null;
	}

	if (room.itsMe) {
		return userId;
	}

	// legacy method
	if (!room?.uids && room.rid && room.t === 'd' && userId) {
		return room.rid.replace(userId, '').trim();
	}

	if (isGroupChat(room)) {
		return null;
	}

	const me = room.uids?.find(uid => uid === userId);
	const other = room.uids?.filter(uid => uid !== userId);

	return other && other.length ? other[0] : me;
}

export function getRoomTitle(room) {
	const { UI_Use_Real_Name: useRealName, UI_Allow_room_names_with_special_chars: allowSpecialChars } =
		reduxStore.getState().settings;
	const { username } = reduxStore.getState().login.user;
	if (isGroupChat(room) && !(room.name && room.name.length) && room.usernames) {
		return room.usernames
			.filter(u => u !== username)
			.sort((u1, u2) => u1.localeCompare(u2))
			.join(', ');
	}
	if (allowSpecialChars && room.t !== 'd') {
		return room.fname || room.name;
	}
	return ((room?.prid || useRealName) && room?.fname) || room?.name;
}

export function getSenderName(sender) {
	const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
	return useRealName ? sender.name : sender.username;
}

export function canAutoTranslate() {
	try {
		const { AutoTranslate_Enabled } = reduxStore.getState().settings;
		if (!AutoTranslate_Enabled) {
			return false;
		}
		const autoTranslatePermission = reduxStore.getState().permissions['auto-translate'];
		const userRoles = reduxStore.getState().login?.user?.roles ?? [];
		return autoTranslatePermission?.some(role => userRoles.includes(role)) ?? false;
	} catch (e) {
		log(e);
		return false;
	}
}

export function isRead(item) {
	let isUnread = item.archived !== true && item.open === true; // item is not archived and not opened
	isUnread = isUnread && (item.unread > 0 || item.alert === true); // either its unread count > 0 or its alert
	return !isUnread;
}

export function hasRole(role): boolean {
	const loginUser = reduxStore.getState().login.user;
	const userRoles = loginUser?.roles || [];
	return userRoles.indexOf(role) > -1;
}

export async function hasPermission(permissions, rid?: any): Promise<boolean[]> {
	let roomRoles = [];
	if (rid) {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		try {
			// get the room from database
			const room = await subsCollection.find(rid);
			// get room roles
			roomRoles = room.roles || [];
		} catch (error) {
			console.log('hasPermission -> Room not found');
			return permissions.map(() => false);
		}
	}

	try {
		const loginUser = reduxStore.getState().login.user;
		const userRoles = loginUser?.roles || [];
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];
		return permissions.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
	} catch (e) {
		log(e);
	}
}
