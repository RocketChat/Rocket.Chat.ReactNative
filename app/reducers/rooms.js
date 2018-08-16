import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	searchText: '',
	showServerDropdown: false,
	closeServerDropdown: false
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
		default:
			return state;
	}
}
