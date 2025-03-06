import { IRoomsAction } from '../actions/rooms';
import { ROOMS } from '../actions/actionsTypes';

export interface IRooms {
	isFetching: boolean;
	refreshing: boolean;
	failure: boolean;
	errorMessage: Record<string, any> | string;
	searchText: string;
	showSearchHeader: boolean;
}

export const initialState: IRooms = {
	isFetching: false,
	refreshing: false,
	failure: false,
	errorMessage: {},
	searchText: '',
	showSearchHeader: false
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
		case ROOMS.SET_SEARCH:
			return {
				...state,
				searchText: action.searchText
			};
		case ROOMS.OPEN_SEARCH_HEADER:
			return {
				...state,
				showSearchHeader: true
			};
		case ROOMS.CLOSE_SEARCH_HEADER:
			return {
				...state,
				showSearchHeader: false
			};
		default:
			return state;
	}
}
