import { store as reduxStore } from '~/lib/store/auxStore';
import { isGroupChat } from './isGroupChat';

export function getUidDirectMessage(room: any, loggedUserId?: string) {
	const userId = loggedUserId ?? reduxStore.getState().login.user.id;

	if (!room) {
		return null;
	}

	if (room.itsMe) {
		return userId;
	}

	if (!room?.uids && room.rid && room.t === 'd' && userId) {
		return room.rid.replace(userId, '').trim();
	}

	if (isGroupChat(room)) {
		return null;
	}

	const me = room.uids?.find((uid: string) => uid === userId);
	const other = room.uids?.filter((uid: string) => uid !== userId);

	return other && other.length ? other[0] : me;
}
