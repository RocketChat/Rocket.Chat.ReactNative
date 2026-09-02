import { store as reduxStore } from '../../store/auxStore';
import { type ISubscription } from '../../../definitions';
import { hasPermission } from './helpers';

const canPostReadOnly = async (room: Partial<ISubscription>, username?: string) => {
	// RC 6.4.0
	const isUnmuted = !!room?.unmuted?.find(m => m === username);
	// TODO: this is not reactive. If this permission changes, the component won't be updated
	const postReadOnlyPermission = reduxStore.getState().permissions['post-readonly'];
	const permission = await hasPermission([postReadOnlyPermission], room.rid);
	return permission[0] || isUnmuted;
};

const isMuted = (room: Partial<ISubscription>, username?: string) =>
	room && room.muted && room.muted.find && !!room.muted.find(m => m === username);

const evaluateReadOnly = (room: Partial<ISubscription>, username: string | undefined, allowPost: boolean): boolean => {
	if (room.archived) {
		return true;
	}
	if (isMuted(room, username)) {
		return true;
	}
	if (room?.ro) {
		return !allowPost;
	}
	return false;
};

export const isReadOnly = async (room: Partial<ISubscription>, username?: string): Promise<boolean> => {
	if (room.archived || isMuted(room, username)) {
		return true;
	}
	const allowPost = room?.ro ? await canPostReadOnly(room, username) : false;
	return evaluateReadOnly(room, username, allowPost);
};

export const isReadOnlySync = (
	room: Partial<ISubscription>,
	username: string,
	postReadOnlyPermission: string[] | undefined,
	userRoles: string[]
): boolean => {
	let allowPost = false;
	if (room?.ro) {
		const isUnmuted = !!room?.unmuted?.find(m => m === username);
		const mergedRoles = [...new Set([...(room.roles || []), ...userRoles])];
		allowPost = !!postReadOnlyPermission?.some(r => mergedRoles.includes(r)) || isUnmuted;
	}
	return evaluateReadOnly(room, username, allowPost);
};
