import { store as reduxStore } from '../../store/auxStore';
import { ISubscription } from '../../../definitions';
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

export const isReadOnly = async (room: Partial<ISubscription>, username: string): Promise<boolean> => {
	if (room.archived) {
		return true;
	}
	if (isMuted(room, username)) {
		return true;
	}
	if (room?.ro) {
		const allowPost = await canPostReadOnly(room, username);
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
