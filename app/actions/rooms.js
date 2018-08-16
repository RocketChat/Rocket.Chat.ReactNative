import * as types from './actionsTypes';


export function roomsRequest() {
	return {
		type: types.ROOMS.REQUEST
	};
}

export function roomsSuccess() {
	return {
		type: types.ROOMS.SUCCESS
	};
}

export function roomsFailure(err) {
	return {
		type: types.ROOMS.FAILURE,
		err
	};
}

export function setSearch(searchText) {
	return {
		type: types.ROOMS.SET_SEARCH,
		searchText
	};
}

export function closeServerDropdown() {
	return {
		type: types.ROOMS.CLOSE_SERVER_DROPDOWN
	};
}

export function toggleServerDropdown() {
	return {
		type: types.ROOMS.TOGGLE_SERVER_DROPDOWN
	};
}
