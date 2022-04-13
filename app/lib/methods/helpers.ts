// @ts-nocheck - TEMP
import AsyncStorage from '@react-native-community/async-storage';

import log from '../../utils/log';
import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import subscribeRoomsTmp from './subscriptions/rooms';
import { ANALYTICS_EVENTS_KEY, CRASH_REPORT_KEY, defaultSettings } from '../constants';

export function isGroupChat(room): boolean {
	return ((room.uids && room.uids.length > 2) || (room.usernames && room.usernames.length > 2)) ?? false;
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
	return ((room.prid || useRealName) && room.fname) || room.name;
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
	const shareUser = reduxStore.getState().share.user;
	const loginUser = reduxStore.getState().login.user;
	const userRoles = shareUser?.roles || loginUser?.roles || [];
	return userRoles.indexOf(role) > -1;
}

// AsyncStorage
export async function getAllowCrashReport() {
	const allowCrashReport = await AsyncStorage.getItem(CRASH_REPORT_KEY);
	if (allowCrashReport === null) {
		return true;
	}
	return JSON.parse(allowCrashReport);
}

export async function getAllowAnalyticsEvents() {
	const allowAnalyticsEvents = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
	if (allowAnalyticsEvents === null) {
		return true;
	}
	return JSON.parse(allowAnalyticsEvents);
}

// TODO: remove this
export async function subscribeRooms(this: any) {
	if (!this.roomsSub) {
		try {
			// TODO: We need to change this naming. Maybe move this logic to the SDK?
			this.roomsSub = await subscribeRoomsTmp.call(this);
		} catch (e) {
			log(e);
		}
	}
}

// TODO: remove this
export function unsubscribeRooms(this: any) {
	if (this.roomsSub) {
		this.roomsSub.stop();
		this.roomsSub = null;
	}
}

export function parseSettings(settings) {
	return settings.reduce((ret, item) => {
		ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
		if (item._id === 'Hide_System_Messages') {
			ret[item._id] = ret[item._id].reduce(
				(array, value) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])],
				[]
			);
		}
		return ret;
	});
}

export function _prepareSettings(settings) {
	return settings.map(setting => {
		setting[defaultSettings[setting._id].type] = setting.value;
		return setting;
	});
}

export async function hasPermission(permissions, rid?: any) {
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
		const shareUser = reduxStore.getState().share.user;
		const loginUser = reduxStore.getState().login.user;
		// get user roles on the server from redux
		const userRoles = shareUser?.roles || loginUser?.roles || [];
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];
		return permissions.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
	} catch (e) {
		log(e);
	}
}
