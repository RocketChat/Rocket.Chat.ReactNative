import { type IRoomsAction } from '../actions/rooms';
import { ROOMS } from '../actions/actionsTypes';

export interface IRecentRoomsStore {
	rid: string;
	name: string;
}
export interface IRooms {
	isFetching: boolean;
	refreshing: boolean;
	failure: boolean;
	errorMessage: Record<string, any> | string;
	lastVisitedRid: string;
	lastVisitedName: string;
	recentRooms: IRecentRoomsStore[];
}

export const initialState: IRooms = {
	isFetching: false,
	refreshing: false,
	failure: false,
	errorMessage: {},
	lastVisitedRid: '',
	lastVisitedName: '',
	recentRooms: []
};

export default function rooms(state = initialState, action: IRoomsAction): IRooms {
	switch (action.type) {
		case ROOMS.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				errorMessage: {}
			};
		case ROOMS.SUCCESS:
			return {
				...state,
				isFetching: false,
				refreshing: false
			};
		case ROOMS.FAILURE:
			return {
				...state,
				isFetching: false,
				refreshing: false,
				failure: true,
				errorMessage: action.err
			};
		case ROOMS.REFRESH:
			return {
				...state,
				isFetching: true,
				refreshing: true
			};
		case ROOMS.STORE_LAST_VISITED:
			const newRoom = { rid: action.lastVisitedRoomId, name: action.lastVisitedRoomName };

			const existingIndex = state.recentRooms.findIndex(room => room.rid === newRoom.rid);
			let updatedRecentRooms: IRecentRoomsStore[];

			if (existingIndex !== -1) {
				// Move existing room to end
				updatedRecentRooms = [
					...state.recentRooms.slice(0, existingIndex),
					...state.recentRooms.slice(existingIndex + 1),
					newRoom
				];
			} else {
				// Add new room
				updatedRecentRooms = [...state.recentRooms, newRoom];
			}

			if (updatedRecentRooms.length > 3) {
				updatedRecentRooms = updatedRecentRooms.slice(-3);
			}

			return {
				...state,
				lastVisitedRid: action.lastVisitedRoomId,
				lastVisitedName: action.lastVisitedRoomName,
				recentRooms: updatedRecentRooms
			};
		case ROOMS.STORE_RECENT_ROOMS:
			return {
				...state,
				recentRooms: action.recentRooms
			};

		default:
			return state;
	}
}
