import { getSubscriptionByRoomId } from '../database/services/Subscription';
import RocketChat from '../rocketchat';

const getRoomInfo = async(rid) => {
	let result;
	result = await getSubscriptionByRoomId(rid);
	if (result) {
		return {
			rid,
			name: result.name,
			fname: result.fname,
			t: result.t
		};
	}

	result = await RocketChat.getRoomInfo(rid);
	if (result?.success) {
		return {
			rid,
			name: result.room.name,
			fname: result.room.fname,
			t: result.room.t
		};
	}

	return null;
};

export default getRoomInfo;
