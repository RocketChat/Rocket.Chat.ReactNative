import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';

const navigate = ({ item, isMasterDetail, ...props }) => {
	let navigationMethod = props.navigationMethod ?? Navigation.navigate;

	if (isMasterDetail) {
		navigationMethod = Navigation.replace;
	}

	navigationMethod('RoomView', {
		rid: item.rid,
		name: RocketChat.getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		visitor: item.visitor,
		roomUserId: RocketChat.getUidDirectMessage(item),
		...props
	});
};

export const goRoom = async({ item = {}, isMasterDetail = false, ...props }) => {
	if (item.t === 'd' && item.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await RocketChat.createDirectMessage(username);
			if (result.success) {
				return navigate({
					item: {
						rid: result.room._id,
						name: username,
						t: 'd'
					},
					isMasterDetail,
					...props
				});
			}
		} catch {
			// Do nothing
		}
	}

	return navigate({ item, isMasterDetail, ...props });
};
