import { store as reduxStore } from '../../store/auxStore';
import { type ISubscription } from '../../../definitions';
import { hasPermission } from './helpers';

const canPostReadOnly = async (room: Partial<ISubscription>, username: string) => {
	// RC 6.4.0
	const isUnmuted = !!room?.unmuted?.find(m => m === username);
	// TODO: this is not reactive. If this permission changes, the component won't be updated
	const postReadOnlyPermission = reduxStore.getState().permissions['post-readonly'];
	const permission = await hasPermission([postReadOnlyPermission], room.rid);
	return permission[0] || isUnmuted;
};

const isMuted = (room: Partial<ISubscription>, username: string) =>
	room && room.muted && room.muted.find && !!room.muted.find(m => m === username);

// Shared branch chain gating message posting. `allowPost` is resolved by each caller
// (async via a permission fetch, sync via precomputed roles) and only consulted when `ro`.
const evaluate = (room: Partial<ISubscription>, username: string, allowPost: boolean): boolean => {
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

export const isReadOnly = async (room: Partial<ISubscription>, username: string): Promise<boolean> => {
	const allowPost = room?.ro ? await canPostReadOnly(room, username) : false;
	return evaluate(room, username, allowPost);
};

// Synchronous counterpart to `isReadOnly` for callers that already hold a reactively-observed
// room (with `.roles`) and the current user's roles, avoiding the async DB re-fetch in `hasPermission`.
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
	return evaluate(room, username, allowPost);
};
