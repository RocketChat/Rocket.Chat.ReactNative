import { store as reduxStore } from '../../store/auxStore';
import { type ISubscription } from '../../../definitions';
import { hasPermission } from './helpers';

const canPostReadOnly = async (room: Partial<ISubscription>, username: string, postReadOnlyPermission?: string[]) => {
	// RC 6.4.0
	const isUnmuted = !!room?.unmuted?.find(m => m === username);
	// Use provided permission or fallback to static snapshot for backward compatibility
	const permissionToCheck = postReadOnlyPermission ?? reduxStore.getState().permissions['post-readonly'];
	const permission = await hasPermission([permissionToCheck], room.rid);
	return permission[0] || isUnmuted;
};

const isMuted = (room: Partial<ISubscription>, username: string) =>
	room && room.muted && room.muted.find && !!room.muted.find(m => m === username);

export const isReadOnly = async (
	room: Partial<ISubscription>,
	username: string,
	postReadOnlyPermission?: string[]
): Promise<boolean> => {
	if (room.archived) {
		return true;
	}
	if (isMuted(room, username)) {
		return true;
	}
	if (room?.ro) {
		const allowPost = await canPostReadOnly(room, username, postReadOnlyPermission);
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
