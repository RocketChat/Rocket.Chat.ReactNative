import log from './log';
import { store as reduxStore } from '../../store/auxStore';
import database from '../../database';
import { type IRoom, type ISubscription, type TSubscriptionModel } from '../../../definitions';
import { type IUserMessage } from '../../../definitions/IMessage';

// Helper type for room-like objects that can be either IRoom or ISubscription
type TRoomLike = Pick<IRoom | ISubscription, 'uids' | 'usernames' | 'prid' | 'fname' | 'name'> & {
	t?: string;
	rid?: string;
	federated?: boolean;
};

/**
 * Determines if a room is a group chat (more than 2 participants)
 */
export function isGroupChat(room: Partial<TRoomLike> | undefined): boolean {
	return ((room?.uids && room.uids.length > 2) || (room?.usernames && room.usernames.length > 2)) ?? false;
}

/**
 * Gets the avatar identifier for a room
 */
export function getRoomAvatar(room: Partial<TRoomLike> | undefined): string | undefined {
	if (isGroupChat(room) && room?.uids && room?.usernames) {
		return room.uids.length + room.usernames.join();
	}
	return room?.prid ? room.fname : room?.name;
}

/**
 * Gets the UID of the other participant in a direct message
 */
export function getUidDirectMessage(room: (Partial<TRoomLike> & { itsMe?: boolean }) | null): string | undefined {
	const { id: userId } = reduxStore.getState().login.user;

	if (!room) {
		return undefined;
	}

	if (room.itsMe) {
		return userId || undefined;
	}

	// legacy method
	if (!room?.uids && room.rid && room.t === 'd' && userId) {
		return room.rid.replace(userId, '').trim();
	}

	if (isGroupChat(room)) {
		return undefined;
	}

	const me = room.uids?.find(uid => uid === userId);
	const other = room.uids?.filter(uid => uid !== userId);

	return (other && other.length ? other[0] : me) || undefined;
}

/**
 * Gets the display title for a room
 */
export function getRoomTitle(room: Partial<TRoomLike> | undefined): string | undefined {
	const { UI_Use_Real_Name: useRealName, UI_Allow_room_names_with_special_chars: allowSpecialChars } =
		reduxStore.getState().settings;
	const { username } = reduxStore.getState().login.user;
	if (room && 'federated' in room && room.federated === true) {
		return room.fname;
	}
	if (isGroupChat(room) && !(room?.name && room.name.length) && room?.usernames) {
		return room.usernames
			.filter(u => u !== username)
			.sort((u1, u2) => u1.localeCompare(u2))
			.join(', ');
	}
	if (allowSpecialChars && room?.t !== 'd') {
		return room?.fname || room?.name;
	}
	return ((room?.prid || useRealName) && room?.fname) || room?.name;
}

/**
 * Gets the sender name based on settings (real name or username)
 */
export function getSenderName(sender: IUserMessage): string {
	const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
	return (useRealName ? sender.name : sender.username) || '';
}

/**
 * Checks if the current user can use auto-translate feature
 */
export function canAutoTranslate(): boolean {
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

/**
 * Checks if a subscription/room item is read
 */
export function isRead(item: Partial<ISubscription>): boolean {
	let isUnread = item.archived !== true && item.open === true; // item is not archived and not opened
	isUnread = isUnread && ((item.unread ?? 0) > 0 || item.alert === true); // either its unread count > 0 or its alert
	return !isUnread;
}

/**
 * Checks if the current user has a specific role
 */
export function hasRole(role: string): boolean {
	const loginUser = reduxStore.getState().login.user;
	const userRoles = loginUser?.roles || [];
	return userRoles.indexOf(role) > -1;
}

/**
 * Checks if the current user has specific permissions in a room
 * @param permissions Array of permission role arrays to check
 * @param rid Optional room ID to check room-specific roles
 * @returns Array of boolean values indicating if each permission is granted
 */
export async function hasPermission(permissions: Array<string[] | undefined>, rid?: string): Promise<(boolean | undefined)[]> {
	let roomRoles: string[] = [];
	if (rid) {
		const db = database.active;
		const subsCollection = db.get<TSubscriptionModel>('subscriptions');
		try {
			// get the room from database
			const room = await subsCollection.find(rid);
			// get room roles
			if (room.roles) {
				roomRoles = room.roles;
			}
		} catch (error) {
			console.log('hasPermission -> Room not found');
			return permissions.map(() => false);
		}
	}

	try {
		const loginUser = reduxStore.getState().login.user;
		const userRoles = loginUser?.roles || [];
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];
		return permissions.map(permission => permission?.some(r => mergedRoles.includes(r)));
	} catch (e) {
		log(e);
		return permissions.map(() => false);
	}
}
