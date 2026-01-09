import { LAST_VISITED_ROOM_ID_KEY, LAST_VISITED_ROOM_Name_KEY } from '../../constants/keys';
import { roomsStoreLastVisited } from '../../../actions/rooms';
import store from '../../store';
import UserPreferences from '../userPreferences';

export const storeLastVisitedRoom = (rid: string, name: string) => {
	UserPreferences.setString(LAST_VISITED_ROOM_ID_KEY, rid);
	UserPreferences.setString(LAST_VISITED_ROOM_Name_KEY, name);
	store.dispatch(roomsStoreLastVisited(rid, name));
	console.log('storing last visited room ====================');
};
