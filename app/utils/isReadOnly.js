import RocketChat from '../lib/rocketchat';

const canPost = async({ rid }) => {
	try {
		const permission = await RocketChat.hasPermission(['post-readonly'], rid);
		return permission && permission['post-readonly'];
	} catch {
		// do nothing
	}
	return false;
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
		const allowPost = await canPost(room);
		if (allowPost) {
			return false;
		}
		return true;
	}
	return false;
};
