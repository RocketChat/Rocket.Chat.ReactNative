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

export function searchRequest(searchText) {
	return {
		type: types.ROOMS.SEARCH_REQUEST,
		searchText
	};
}

export function searchSuccess() {
	return {
		type: types.ROOMS.SEARCH_SUCCESS
	};
}

export function searchFailure(err) {
	return {
		type: types.ROOMS.SEARCH_FAILURE,
		err
	};
}
