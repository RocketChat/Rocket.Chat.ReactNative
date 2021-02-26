import RocketChat from '../lib/rocketchat';
import reduxStore from '../lib/createStore';

const canPostReadOnly = async({ rid }) => {
	// TODO: this is not reactive. If this permission changes, the component won't be updated
	const postReadOnlyPermission = reduxStore.getState().permissions['post-readonly'];
	const permission = await RocketChat.hasPermission([postReadOnlyPermission], rid);
	return permission[0];
};

const isMuted = (room, user) => room && room.muted && room.muted.find && !!room.muted.find(m => m === user.username);

export const isReadOnly = async(room, user) => {
	if (room.archived) {
		return true;
	}
	if (isMuted(room, user)) {
		return true;
	}
	if (room?.ro) {
		const allowPost = await canPostReadOnly(room);
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
