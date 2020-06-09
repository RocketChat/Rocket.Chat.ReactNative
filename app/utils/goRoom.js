import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';

const navigate = (item) => {
	Navigation.navigate('RoomView', {
		rid: item.rid,
		name: RocketChat.getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		search: item.search,
		visitor: item.visitor,
		roomUserId: RocketChat.getUidDirectMessage(item)
	});
};

export const goRoom = async(item = {}) => {
	if (!item.search) {
		return navigate(item);
	}
	if (item.t === 'd') {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await RocketChat.createDirectMessage(username);
			if (result.success) {
				return navigate({
					rid: result.room._id,
					name: username,
					t: 'd'
				});
			}
		} catch {
			// Do nothing
		}
	} else {
		return navigate(item);
	}
};
