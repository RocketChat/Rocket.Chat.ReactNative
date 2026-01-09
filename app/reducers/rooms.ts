import { type IRoomsAction } from '../actions/rooms';
import { ROOMS } from '../actions/actionsTypes';

export interface IRooms {
	isFetching: boolean;
	refreshing: boolean;
	failure: boolean;
	errorMessage: Record<string, any> | string;
	lastVisitedRid: string;
	lastVisitedName: string;
}

export const initialState: IRooms = {
	isFetching: false,
	refreshing: false,
	failure: false,
	errorMessage: {},
	lastVisitedRid: '',
	lastVisitedName: ''
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
			return {
				...state,
				lastVisitedRid: action.lastVisitedRoomId,
				lastVisitedName: action.lastVisitedRoomName
			};

		default:
			return state;
	}
}
