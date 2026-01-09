import { LAST_VISITED_ROOM_KEY } from '../../constants/keys';
import { roomsStoreLastVisited } from '../../../actions/rooms';
import store from '../../store';
import UserPreferences from '../userPreferences';

export const storeLastVisitedRoomId = (rid: string) => {
	UserPreferences.setString(LAST_VISITED_ROOM_KEY, rid);
	store.dispatch(roomsStoreLastVisited(rid));
	console.log('storing last visited room ====================');
};
