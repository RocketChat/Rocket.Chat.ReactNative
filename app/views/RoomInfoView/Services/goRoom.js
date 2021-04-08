import Navigation from '../../../lib/Navigation';
import { logEvent, events } from '../../../utils/log';
import RocketChat from '../../../lib/rocketchat';
import { goRoom } from '../../../utils/goRoom';

const goRoomService = (state, props) => {
	logEvent(events.RI_GO_ROOM_USER);
	const { roomUser, room } = state;
	const { name, username } = roomUser;
	const { rooms, navigation, isMasterDetail } = props;
	const params = {
		rid: room.rid,
		name: RocketChat.getRoomTitle({
			t: room.t,
			fname: name,
			name: username
		}),
		t: room.t,
		roomUserId: RocketChat.getUidDirectMessage(room)
	};

	if (room.rid) {
		// if it's on master detail layout, we close the modal and replace RoomView
		if (isMasterDetail) {
			Navigation.navigate('DrawerNavigator');
			goRoom({ item: params, isMasterDetail });
		} else {
			let navigate = navigation.push;
			// if this is a room focused
			if (rooms.includes(room.rid)) {
				({ navigate } = navigation);
			}
			navigate('RoomView', params);
		}
	}
};

export default goRoomService;
