import RocketChat from '../../../lib/rocketchat';
import log from '../../../utils/log';
import setHeader from '../Components/header';


const loadRoom = async(route, editRoomPermission, navigation, roomUser, roomState, showEdit, setState, rid) => {
	let room = route.params?.room;

	const permissions = await RocketChat.hasPermission([editRoomPermission], room.rid);
	if (permissions[0] && !room.prid) {
		setState({ showEdit: true }, () => setHeader(roomUser, roomState, showEdit, navigation, route));
	}

	if (room && room.observe) {
		const roomObservable = room.observe();
		return roomObservable
			.subscribe((changes) => {
				setState({ room: changes }, () => setHeader(roomUser, roomState, showEdit, navigation, route));
			});
	} else {
		try {
			const result = await RocketChat.getRoomInfo(rid);
			if (result.success) {
				({ room } = result);
				setState({ room: { ...roomState, ...room } });
			}
		} catch (e) {
			log(e);
		}
	}

	return null;
};

export default loadRoom;
