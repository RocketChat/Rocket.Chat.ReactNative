import * as types from './actionsTypes';


export function roomsRequest(params = { allData: false }) {
	return {
		type: types.ROOMS.REQUEST,
		params
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

export function roomsRefresh() {
	return {
		type: types.ROOMS.REFRESH
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

export function closeSortDropdown() {
	return {
		type: types.ROOMS.CLOSE_SORT_DROPDOWN
	};
}

export function toggleSortDropdown() {
	return {
		type: types.ROOMS.TOGGLE_SORT_DROPDOWN
	};
}

export function openSearchHeader() {
	return {
		type: types.ROOMS.OPEN_SEARCH_HEADER
	};
}

export function closeSearchHeader() {
	return {
		type: types.ROOMS.CLOSE_SEARCH_HEADER
	};
}
