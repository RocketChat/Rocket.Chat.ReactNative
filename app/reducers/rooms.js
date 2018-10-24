import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	searchText: '',
	showServerDropdown: false,
	closeServerDropdown: false,
	showSortDropdown: false,
	showSearchHeader: false
};

export default function login(state = initialState, action) {
	switch (action.type) {
		case types.ROOMS.REQUEST:
			return {
				...state,
				isFetching: true
			};
		case types.ROOMS.SUCCESS:
			return {
				...state,
				isFetching: false
			};
		case types.ROOMS.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				errorMessage: action.err
			};
		case types.ROOMS.SET_SEARCH:
			return {
				...state,
				searchText: action.searchText
			};
		case types.ROOMS.CLOSE_SERVER_DROPDOWN:
			return {
				...state,
				closeServerDropdown: !state.closeServerDropdown
			};
		case types.ROOMS.TOGGLE_SERVER_DROPDOWN:
			return {
				...state,
				showServerDropdown: !state.showServerDropdown
			};
		case types.ROOMS.CLOSE_SORT_DROPDOWN:
			return {
				...state,
				closeSortDropdown: !state.closeSortDropdown
			};
		case types.ROOMS.TOGGLE_SORT_DROPDOWN:
			return {
				...state,
				showSortDropdown: !state.showSortDropdown
			};
		case types.ROOMS.OPEN_SEARCH_HEADER:
			return {
				...state,
				showSearchHeader: true
			};
		case types.ROOMS.CLOSE_SEARCH_HEADER:
			return {
				...state,
				showSearchHeader: false
			};
		default:
			return state;
	}
}
