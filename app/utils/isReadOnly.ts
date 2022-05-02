import { store as reduxStore } from '../lib/store/auxStore';
import { ISubscription } from '../definitions/ISubscription';
import { hasPermission } from '../lib/methods';

const canPostReadOnly = async ({ rid }: { rid: string }) => {
	// TODO: this is not reactive. If this permission changes, the component won't be updated
	const postReadOnlyPermission = reduxStore.getState().permissions['post-readonly'];
	const permission = await hasPermission([postReadOnlyPermission], rid);
	return permission[0];
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
		const allowPost = await canPostReadOnly({ rid: room.rid as string });
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
